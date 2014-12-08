IOC.DI = function (ioc) {

  var registry = {};
  var factories = {};

  var _resolveArgs = function (args) {
    var failure = false;
    var resolved = [];
    args.forEach(function (arg) {
      if (typeof arg.value !== 'undefined') {
        resolved.push(arg.value);
      } else if (typeof arg.ref !== 'undefined') {
        var ref = ioc.di.getInstance(arg.ref);
        if (ref) {
          resolved.push(ref);
        } else {
          failure = true;
        }
      } else if (typeof arg.func !== 'undefined') {
        resolved.push(arg.func);
      } else if (typeof arg.exec !== 'undefined') {
        resolved.push(arg.exec());
      }
    });
    return failure ? null : resolved;
  };

  var _execFunction = function (instance, func, args) {
    var resolvedFunc = (typeof func === 'function' ? func : ioc.object.get(ioc.di.getInstance(instance), func));
    if (resolvedFunc) {
      var resolvedArgs = _resolveArgs(args || []);
      if (resolvedArgs) {
        resolvedFunc.apply(resolvedFunc, resolvedArgs);
      } else {
        throw 'Unable to resolve arguments for "' + func + '" of instance "' + instance + '"';
      }
    } else {
      throw 'Unknown function "' + func + '" for instance "' + instance + '"';
    }
  };

  var _addInstance = function (name, instance, factory, args) {
    registry[name] = instance;
    if (factory) {
      factories[name] = args;
    }
  };

  var _getInstance = function (name) {
    if (factories.hasOwnProperty(name)) {
      var args = _resolveArgs(factories[name]);
      if (args) {
        return registry[name].apply(registry[name], args);
      } else {
        throw 'Unable to resolve arguments for "' + name;
      }
    } else {
      return registry[name];
    }
  };

  var _wire = function (instances) {
    if (!instances)
      throw 'Your context defines no instances';

    var instanceKeys = ioc.object.keys(instances);
    var unresolved = {};

    instanceKeys.forEach(function (instance) {
      var func = ioc.object.get(window, instances[instance].namespace);
      if (func) {
        var args = _resolveArgs(instances[instance].args || []);
        if (args) {
          window.console.log(instance, 'wired');
          var actualInstance = instances[instance].factory ? func : func.apply(func, args);
          ioc.di.addInstance(instance, actualInstance, instances[instance].factory, instances[instance].args || []);
          if (instances[instance].extension) {
            ioc = ioc.object.extend(ioc, actualInstance);
          }
        } else {
          unresolved[instance] = instances[instance];
        }
      } else {
        throw 'Unknown function "' + instances[instance].namespace + '"';
      }
    });

    var unresolvedKeys = ioc.object.keys(unresolved);
    if (unresolvedKeys.length !== instances.length && unresolvedKeys.length > 0) {
      _wire(unresolved);
    } else {
      if (unresolvedKeys.length !== 0) {
        throw 'Make sure you don\'t have circular dependencies, Unable to resolve the following instances: ' + unresolvedKeys.join(", ");
      }
    }
  };

  var _init = function (instances) {
    ioc.object.keys(instances).forEach(function (instance) {
      if (instances[instance].init) {
        _execFunction(instance, instances[instance].init.func, instances[instance].init.args);
      }
    });
  };

  var _start = function (starts) {
    if (document.readyState !== 'complete') {
      window.setTimeout(function () {
        _start(starts);
      }, 100);
    } else {
      starts.forEach(function (start) {
        if (start.instance) {
          _execFunction(start.instance, start.func, start.args);
        } else if (start.func) {
          _execFunction(null, start.func, start.args);
        }
      });
    }
  };

  var _loadDependencies = function () {
    var dependencies = ioc.config.context.dependencies[ioc.config.mode];

    var seqLatch = ioc.async.seqLatch(dependencies.sync || [], function (url) {
      ioc.loadScript(url, seqLatch.next);
    }, function () {
      var latch = ioc.async.latch(dependencies.async ? dependencies.async.length : 0, function () {
        window.console.log('wire instances');
        _wire(ioc.config.context.instances);
        window.console.log('init instances');
        _init(ioc.config.context.instances);
        window.console.log('start instances');
        _start(ioc.config.context.start);
      }, 'dependencies');
      dependencies.async.forEach(function (dep) {
        ioc.loadScript(dep, latch.countDown);
      });
    });
    seqLatch.next();
  };

  var _mergeImports = function (imports) {
    var imp = imports.pop();
    var unloadedImports = [];

    while (imp) {
      if (!ioc.object.get(window, imp.namespace)) {
        unloadedImports.push(imp);
      } else {
        ioc.config = ioc.object.extend(ioc.config, ioc.object.get(window, imp.namespace)());
      }
      imp = imports.pop();
    }

    if (unloadedImports.length !== 0) {
      var latch = ioc.async.latch(unloadedImports.length, function () {
        _mergeImports(unloadedImports);
      }, 'imports');
      unloadedImports.forEach(function (subImp) {
        ioc.loadScript(subImp.url, latch.countDown);
      });
    } else {
      _loadDependencies();
    }
  };

  var _loadConfig = function (config) {
    ioc.di.addInstance('ioc', ioc);
    ioc.config = config;
    ioc.config.mode = ioc.url.query().env || 'default';
    if (config.exposeIoc) {
      window.ioc = ioc;
    }

    if (ioc.config.imports) {
      _mergeImports(JSON.parse(JSON.stringify(ioc.config.imports)));
    } else {
      _loadDependencies();
    }
  };

  return {
    di: {
      loadConfig: _loadConfig,
      getInstance: _getInstance,
      addInstance: _addInstance
    }
  };
};