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

  var _resolveArgs = function (execution, done, type) {
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
        if (type === 'factory') {
          arenite.context.remove(tempId);
        } else {
          execution.args.splice(idx, 1, {ref: tempId});
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
      if (instances[instance].factory) {
        arenite.context.add(instance, instances[instance], true);
      } else {
        var func = arenite.object.get(window, instances[instance].namespace);
        if (func) {
          var args = _resolveArgs(instances[instance], null, type);
          if (args) {
            var actualInstance = func.apply(func, args);
            if (type === 'extension') {
              var wrappedInstance = {};
              wrappedInstance[instance] = actualInstance;
              arenite = arenite.object.extend(arenite, wrappedInstance);
            } else {
              arenite.context.add(instance, actualInstance);
            }
          } else {
            unresolved[instance] = instances[instance];
          }
        } else {
          throw 'Unknown function "' + instances[instance].namespace + '"';
        }
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
      if (instances[instance].init && !instances[instance].factory) {
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

  var _prodModuleVersion = /[\d]+\.[\d]+\.*[\d]*/;
  var _devRepo = 'https://rawgit.com/{vendor}/{version}/{module}/';
  var _prodRepo = 'https://cdn.rawgit.com/{vendor}/{version}/{module}/';

  var _fetchModules = function (modules, callback) {
    var moduleKeys = arenite.object.keys(modules);
    if (moduleKeys.length) {
      var latch = arenite.async.latch(moduleKeys.length, callback, 'modules');
      arenite.object.forEach(modules, function (module) {
        var moduleBasePath;
        if (module.vendor) {
          if (module.version.match(_prodModuleVersion)) {
            moduleBasePath = _prodRepo.replace('{vendor}', module.vendor);
          } else {
            moduleBasePath = _devRepo.replace('{vendor}', module.vendor);
          }
          moduleBasePath = moduleBasePath.replace('{version}', module.version);
          moduleBasePath = moduleBasePath.replace('{module}', module.module);
        } else {
          moduleBasePath = module.module;
        }

        arenite.loader.loadResource(moduleBasePath + 'module.json', function (xhr) {
          var moduleConf = JSON.parse(xhr.responseText);
          var newDeps = {async: [], sync: []};
          arenite.object.forEach(moduleConf.context.dependencies.default, function (dependencies, depType) {
            dependencies.forEach(function (dep) {
              if (typeof dep === 'string') {
                newDeps[depType].push(moduleBasePath + dep);
              } else {
                newDeps[depType].push(arenite.object.extend(dep, {url: moduleBasePath + dep.url}));
              }
            });
          });
          delete moduleConf.context.dependencies;

          arenite.config.context.dependencies = arenite.config.context.dependencies || {default: {sync: [], async: []}};
          arenite.object.forEach(arenite.config.context.dependencies, function (env) {
            arenite.object.extend(env, newDeps);
          });

          arenite.config = arenite.object.extend(arenite.config, moduleConf);
          if (moduleConf.imports && moduleConf.imports) {
            _fetchModules(moduleConf.imports, latch.countDown);
          } else {
            latch.countDown();
          }
        });
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
      window.console.log('Arenite: Fetching modules', arenite.object.keys(arenite.config.imports));
      _fetchModules(JSON.parse(JSON.stringify(arenite.config.imports)), callback);
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

  var _wireFactory = function (instances) {
    _wire(instances, 'factory');
    _init(instances);
  };

  return {
    di: {
      //###di.init
      // Start arenite with the given configuration
      //<pre><code>
      // init(config)
      //</pre></code>
      //where *<b>config</b>* is the complete configuration with imports
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
      exec: _execFunction,
      //###di.wire
      // Wire a new instance at runtime (used for factories)
      //<pre><code>
      // wire(instanceDefinitions)
      //</pre></code>
      //where *<b>instanceDefinitions</b>* is a list of instance definition objects to be instantiated and initialized.
      wire: _wireFactory
    }
  };
};
