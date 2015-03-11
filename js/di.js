/*global Arenite:true*/
// Collection of utility functions wire the instances and load the configured resources.
Arenite.DI = function (arenite) {

  var anonymous_id = 1;

  var _resolveFunc = function (execution) {
    var resolvedFunc = execution.func;
    if (typeof execution.func === 'function') {
      resolvedFunc = execution.func;
    } else {
      if (execution.extension) {
        resolvedFunc = arenite.object.get(arenite[execution.instance], execution.func);
      } else {
        resolvedFunc = arenite.object.get(arenite.context.get(execution.instance), execution.func);
      }
    }
    return resolvedFunc;
  };

  var _resolveArgs = function (execution, done) {
    if (!execution.args) {
      return [];
    }
    var failure = false;
    var resolved = [];
    execution.args.forEach(function (arg, idx) {
      if (typeof arg.value !== 'undefined') {
        resolved.push(arg.value);
      } else if (typeof arg.ref !== 'undefined') {
        var ref = arenite.context.get(arg.ref);
        if (ref) {
          resolved.push(ref);
        } else {
          failure = true;
        }
      } else if (typeof arg.func !== 'undefined') {
        resolved.push(arg.func);
      } else if (typeof arg.exec !== 'undefined') {
        resolved.push(arg.exec(arenite));
      } else if (typeof arg.instance !== 'undefined') {
        var anonymousContext = {instances: {}};
        var tempId = '__anonymous_temp_instance__' + anonymous_id++;
        anonymousContext.instances[tempId] = arg.instance;
        _loadContext(anonymousContext);
        resolved.push(arenite.context.get(tempId));
        if (!execution.factory) {
          execution.args[idx] = {ref: tempId};
        } else {
          arenite.context.remove(tempId);
        }
      }
    });

    if (execution.wait && typeof done === 'function') {
      resolved.push(done);
    }
    return failure ? null : resolved;
  };

  var _execFunction = function (execution, before, done) {
    var resolvedFunc = _resolveFunc(execution);
    if (resolvedFunc) {
      var resolvedArgs = _resolveArgs(execution, done);
      if (resolvedArgs) {
        if (execution.wait && typeof before === 'function') {
          before();
        }
        resolvedFunc.apply(resolvedFunc, resolvedArgs);
      } else {
        throw 'Unable to resolve arguments for "' + execution.func + '" of instance "' + execution.instance + '"';
      }
    } else {
      throw 'Unknown function "' + execution.func + '" for instance "' + execution.instance + '"';
    }
  };

  var _wire = function (instances, type) {
    if (!instances) {
      return;
    }

    var instanceKeys = arenite.object.keys(instances);
    var unresolved = {};

    instanceKeys.forEach(function (instance) {
      var func = arenite.object.get(window, instances[instance].namespace);
      if (func) {
        var args = instances[instance].factory ? instances[instance].args || [] : _resolveArgs(instances[instance]);
        if (args) {
          var actualInstance = instances[instance].factory ? func : func.apply(func, args);
          if (type === 'extension') {
            var wrappedInstance = {};
            wrappedInstance[instance] = actualInstance;
            arenite = arenite.object.extend(arenite, wrappedInstance);
          } else {
            arenite.context.add(instance, actualInstance, instances[instance].factory, instances[instance].args || []);
          }
        } else {
          unresolved[instance] = instances[instance];
        }
      } else {
        throw 'Unknown function "' + instances[instance].namespace + '"';
      }
    });

    var unresolvedKeys = arenite.object.keys(unresolved);
    if (unresolvedKeys.length !== arenite.object.keys(instances).length && unresolvedKeys.length > 0) {
      _wire(unresolved);
    } else {
      if (unresolvedKeys.length !== 0) {
        throw 'Make sure you don\'t have circular dependencies, Unable to resolve the following instances: ' + unresolvedKeys.join(", ");
      }
    }
  };

  var _init = function (instances, latch, extension) {
    arenite.object.keys(instances).forEach(function (instance) {
      if (instances[instance].init) {
        if (typeof instances[instance].init === 'string') {
          instances[instance].init = {func: instances[instance].init};
        }
        _execFunction(arenite.object.extend({
          instance: instance,
          extension: extension
        }, instances[instance].init), function () {
          latch.countUp();
        }, function () {
          latch.countDown();
        });
      }
    });
  };

  var _start = function (starts) {
    if (!starts) {
      return;
    }
    if (document.readyState !== 'complete') {
      window.setTimeout(function () {
        _start(starts);
      }, 100);
    } else {
      starts.forEach(function (start) {
        _execFunction(start);
      });
    }
  };

  var _loadContext = function (context) {
    if (arenite.config.debug) {
      window.console.time('Arenite context load');
    }
    if (context) {
      //Starting must wait for the wiring
      var wireLatch = arenite.async.latch(1, function () {
        if (arenite.config.debug) {
          window.console.timeEnd('Arenite context load');
        }
        _start(context.start);
      }, "instances");

      //wiring of instances must wait for the extensions
      var extensionsLatch = arenite.async.latch(1, function () {
        _wire(context.instances);
        _init(context.instances, wireLatch);
        wireLatch.countDown();
      }, "extensions");

      _wire(context.extensions, 'extension');
      _init(context.extensions, extensionsLatch, true);
      extensionsLatch.countDown();
    }
  };

  var _loadAsyncDependencies = function (dependencies) {
    var latch = arenite.async.latch(dependencies.async ? dependencies.async.length : 0, function () {
      _loadContext(arenite.config.context);
    }, 'dependencies');
    dependencies.async.forEach(function (dep) {
      arenite.loader.loadScript(dep, latch.countDown);
    });
  };

  var _loadSyncDependencies = function () {
    if (!arenite.config.context || !arenite.config.context.dependencies) {
      return _loadContext(arenite.config.context);
    }

    var dependencies;
    if (!arenite.config.context.dependencies[arenite.config.mode]) {
      dependencies = {sync: [], async: []};
    } else {
      dependencies = arenite.config.context.dependencies[arenite.config.mode];
    }

    var seqLatch = arenite.async.seqLatch(dependencies.sync || [], function (url) {
      arenite.loader.loadScript(url, seqLatch.next);
    }, function () {
      _loadAsyncDependencies(dependencies);
    });
    seqLatch.next();
  };

  var _mergeImports = function (imports, callback) {
    var imp = imports.pop();
    var unloadedImports = [];

    while (imp) {
      if (!arenite.object.get(window, imp.namespace)) {
        unloadedImports.push(imp);
      } else {
        var imported = arenite.object.get(window, imp.namespace)();
        arenite.config = arenite.object.extend(arenite.config, imported);
        if (imported.imports) {
          var newImports = arenite.array.extract(imported.imports, 'namespace');
          window.console.log('Arenite: Merging imports', newImports);
          if (arenite.array.contains(newImports, imp.namespace)) {
            throw 'You have declared a circular import for "' + imp.namespace + '"';
          } else {
            imports = arenite.array.merge(imports, imported.imports);
          }
        }
      }
      imp = imports.pop();
    }

    if (unloadedImports.length !== 0) {
      var latch = arenite.async.latch(unloadedImports.length, function () {
        _mergeImports(unloadedImports, callback);
      }, 'imports');
      unloadedImports.forEach(function (subImp) {
        arenite.loader.loadScript(subImp.url, latch.countDown);
      });
    } else {
      callback();
    }
  };

  var _loadConfig = function (config, callback) {
    arenite.context.add('arenite', arenite);
    arenite.config = config;
    arenite.config.mode = arenite.url.query().mode || 'default';
    window.console.log('Arenite: Starting in mode', arenite.config.mode);
    if (config.debug) {
      if (typeof config.debug === 'function') {
        config.debug = config.debug(arenite);
      }
    }
    if (config.expose) {
      var exposeName = config.expose;
      if (typeof config.expose === 'function') {
        exposeName = config.expose(arenite);
      }
      if (exposeName) {
        window[exposeName] = arenite;
      }
    }

    if (arenite.config.imports) {
      window.console.log('Arenite: Merging imports', arenite.array.extract(arenite.config.imports, 'namespace'));
      _mergeImports(JSON.parse(JSON.stringify(arenite.config.imports)), callback);
    } else {
      callback();
    }
  };

  var _boot = function (config) {
    if (arenite.config) {
      _loadSyncDependencies();
    } else {
      _loadConfig(config, _loadSyncDependencies);
    }
  };

  return {
    di: {
      //###di.init
      // Start arenite with the given configuration
      //<pre><code>
      // init(config)
      //</pre></code>
      //where *<b>config</b>* is the complete or partial configuration (with the imports)
      init: _boot,
      //###di.loadConfig
      // Resolve the imports and merge them into arenite's internal config object
      //<pre><code>
      // loadConfig(config, callback)
      //</pre></code>
      //where *<b>config</b>* is the partial configuration with the imports and *<b>callback</b>* is the callback after
      // the import has extended the config.
      loadConfig: _loadConfig,
      //###di.resolveArgs
      // Resolve the arguments defined in an instance definition AKA execution defined in the arenite configuration format
      //<pre><code>
      // resolveArgs(execution, done)
      //</pre></code>
      //where *<b>execution</b>* is the object describing the execution and *<b>done</b>* is the callback after the execution.
      resolveArgs: _resolveArgs,
      //###di.exec
      // Execute an instance definition AKA execution defined in the arenite configuration format
      //<pre><code>
      // exec(execution, before, done)
      //</pre></code>
      //where *<b>execution</b>* is the object describing the execution, *<b>before</b>* is an optional function to be executed
      // before the actual execution and *<b>done</b>* is the callback after the execution.
      exec: _execFunction
    }
  };
};