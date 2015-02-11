/*global Arenite:true*/
/*jshint evil:true*/
Arenite.DI = function (arenite) {

  var registry = {};
  var factories = {};

  var _resolveFunc = function (execution) {
    var resolvedFunc = execution.func;
    if (typeof execution.func === 'function') {
      resolvedFunc = execution.func;
    } else {
      if (execution.extension) {
        resolvedFunc = arenite.object.get(arenite[execution.instance], execution.func);
      } else {
        resolvedFunc = arenite.object.get(_getInstance(execution.instance), execution.func);
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
    execution.args.forEach(function (arg) {
      if (typeof arg.value !== 'undefined') {
        resolved.push(arg.value);
      } else if (typeof arg.ref !== 'undefined') {
        var ref = _getInstance(arg.ref);
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
        var anonymousContext = {instances: {'__anonymous_temp_instance__': arg.instance}};
        _loadContext(anonymousContext);
        resolved.push(arenite.di.getInstance('__anonymous_temp_instance__'));
        _removeInstance('__anonymous_temp_instance__');
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

  var _addInstance = function (name, instance, factory, args) {
    registry[name] = instance;
    if (factory) {
      factories[name] = args || [];
    }
  };

  var _removeInstance = function (name) {
    arenite.object.delete(registry, name);
  };

  var _getInstance = function (name) {
    if (factories.hasOwnProperty(name)) {
      var args = _resolveArgs({args: factories[name]});
      if (args) {
        return registry[name].apply(registry[name], args);
      } else {
        throw 'Unable to resolve arguments for "' + name + '"';
      }
    } else {
      return registry[name];
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
        var args = _resolveArgs(instances[instance]);
        if (args) {
          window.console.log('Arenite:', instance, 'wired');
          var actualInstance = instances[instance].factory ? func : func.apply(func, args);
          if (type === 'extension') {
            var wrappedInstance = {};
            wrappedInstance[instance] = actualInstance;
            arenite = arenite.object.extend(arenite, wrappedInstance);
          } else {
            _addInstance(instance, actualInstance, instances[instance].factory, instances[instance].args || []);
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
          window.console.log('Arenite:', instance, 'initialized');
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
    if (context) {
      //Starting must wait for the wiring
      var wireLatch = arenite.async.latch(1, function () {
        window.console.log('Arenite: start instances');
        _start(context.start);
      }, "instances");

      //wiring of instances must wait for the extensions
      var extensionsLatch = arenite.async.latch(1, function () {
        window.console.log('Arenite: wire instances');
        _wire(context.instances);
        window.console.log('Arenite: init instances');
        _init(context.instances, wireLatch);
        wireLatch.countDown();
      }, "extensions");

      window.console.log('Arenite: wire extensions');
      _wire(context.extensions, 'extension');
      window.console.log('Arenite: init extensions');
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
      return _loadContext();
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

  var _mergeImports = function (imports) {
    var imp = imports.pop();
    var unloadedImports = [];

    while (imp) {
      if (!arenite.object.get(window, imp.namespace)) {
        unloadedImports.push(imp);
      } else {
        arenite.config = arenite.object.extend(arenite.config, arenite.object.get(window, imp.namespace)());
      }
      imp = imports.pop();
    }

    if (unloadedImports.length !== 0) {
      var latch = arenite.async.latch(unloadedImports.length, function () {
        _mergeImports(unloadedImports);
      }, 'imports');
      unloadedImports.forEach(function (subImp) {
        arenite.loader.loadScript(subImp.url, latch.countDown);
      });
    } else {
      _loadSyncDependencies();
    }
  };

  var _loadConfig = function (config) {
    _addInstance('arenite', arenite);
    arenite.config = config;
    arenite.config.mode = arenite.url.query().env || 'default';
    window.console.log('Arenite: Starting in mode', arenite.config.mode);
    if (config.expose) {
      window.arenite = arenite;
    }

    if (arenite.config.imports) {
      _mergeImports(JSON.parse(JSON.stringify(arenite.config.imports)));
    } else {
      _loadSyncDependencies();
    }
  };

  var _processAnnotations = function (text) {
    var regex = /@arenite-instance\s+["']([^"']+)["']\s*(.*);\s*(@arenite-init\s+["']([^"']+)["']\s*(.*);)*\s*(@arenite-start\s+["']([^"']+)["']\s*(.*);)*\s*\*\/\s*([\w.]+)/g;
    var match;
    while ((match = regex.exec(text))) {
      _processAnnotation(match);
    }
  };

  var _processArgAnnotation = function (match) {
    var args = [];
    var split = match.split(',');
    split.forEach(function (arg) {
      var argPair = arg.split(":");
      var argObj = {};
      argObj[argPair[0].trim()] = argPair[0].trim() === 'ref' ? argPair[1].trim() : eval(argPair[1].trim());
      args.push(argObj);
    });
    return args;
  };

  var _processAnnotation = function (match) {
    var instanceName = match[1];
    var namespace = match[9];

    if (!instanceName) {
      return;
    }
    if (!arenite.config.context) {
      arenite.config.context = {instances: {}};
    }

    //instance
    arenite.config.context.instances[instanceName] = {namespace: namespace};
    if (match[2]) {
      arenite.config.context.instances[instanceName].args = _processArgAnnotation(match[2]);
    }

    // init
    if (match[4]) {
      arenite.config.context.instances[instanceName].init = {func: match[4]};
      if (match[5]) {
        arenite.config.context.instances[instanceName].init.args = _processArgAnnotation(match[5]);
      }
    }

    // start
    if (match[7]) {
      var start = {instance: instanceName, func: match[7]};
      if (match[8]) {
        start.args = _processArgAnnotation(match[8]);
      }
      if (!arenite.config.context.start) {
        arenite.config.context.start = [];
      }
      arenite.config.context.start.push(start);
    }
  };

  return {
    di: {
      loadConfig: _loadConfig,
      getInstance: _getInstance,
      addInstance: _addInstance,
      processAnnotations: _processAnnotations
    }
  };
};