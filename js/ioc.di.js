/*global IOC:true*/
/*jshint evil:true*/
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
        var ref = _getInstance(arg.ref);
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
    var resolvedFunc = (typeof func === 'function' ? func : ioc.object.get(_getInstance(instance), func));
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
      factories[name] = args || [];
    }
  };

  var _getInstance = function (name) {
    if (factories.hasOwnProperty(name)) {
      var args = _resolveArgs(factories[name] || []);
      if (args) {
        return registry[name].apply(registry[name], args);
      } else {
        throw 'Unable to resolve arguments for "' + name + '"';
      }
    } else {
      return registry[name];
    }
  };

  var _wire = function (instances) {
    if (!instances) {
      return;
    }

    var instanceKeys = ioc.object.keys(instances);
    var unresolved = {};

    instanceKeys.forEach(function (instance) {
      var func = ioc.object.get(window, instances[instance].namespace);
      if (func) {
        var args = _resolveArgs(instances[instance].args || []);
        if (args) {
          window.console.log(instance, 'wired');
          var actualInstance = instances[instance].factory ? func : func.apply(func, args);
          _addInstance(instance, actualInstance, instances[instance].factory, instances[instance].args || []);
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
    if (unresolvedKeys.length !== ioc.object.keys(instances).length && unresolvedKeys.length > 0) {
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
    if (!starts) {
      return;
    }
    if (document.readyState !== 'complete') {
      window.setTimeout(function () {
        _start(starts);
      }, 100);
    } else {
      starts.forEach(function (start) {
          _execFunction(start.instance, start.func, start.args);
      });
    }
  };

  var _loadContext = function () {
    if (ioc.config.context) {
      window.console.log('wire instances');
      _wire(ioc.config.context.instances);
      window.console.log('init instances');
      _init(ioc.config.context.instances);
      window.console.log('start instances');
      _start(ioc.config.context.start);
    }
  };

  var _loadAsyncDependencies = function (dependencies) {
    var latch = ioc.async.latch(dependencies.async ? dependencies.async.length : 0, _loadContext, 'dependencies');
    dependencies.async.forEach(function (dep) {
      ioc.loader.loadScript(dep, latch.countDown);
    });
  };

  var _loadSyncDependencies = function () {
    if (!ioc.config.context || !ioc.config.context.dependencies) {
      return _loadContext();
    }

    var dependencies;
    if (!ioc.config.context.dependencies[ioc.config.mode]) {
      dependencies = {sync: [], async: []};
    } else {
      dependencies = ioc.config.context.dependencies[ioc.config.mode];
    }

    var seqLatch = ioc.async.seqLatch(dependencies.sync || [], function (url) {
      ioc.loader.loadScript(url, seqLatch.next);
    }, function () {
      _loadAsyncDependencies(dependencies);
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
        ioc.loader.loadScript(subImp.url, latch.countDown);
      });
    } else {
      _loadSyncDependencies();
    }
  };

  var _loadConfig = function (config) {
    _addInstance('ioc', ioc);
    ioc.config = config;
    ioc.config.mode = ioc.url.query().env || 'default';
    window.console.log('IOC: Starting in mode', ioc.config.mode);
    if (config.exposeIoc) {
      window.ioc = ioc;
    }

    if (ioc.config.imports) {
      _mergeImports(JSON.parse(JSON.stringify(ioc.config.imports)));
    } else {
      _loadSyncDependencies();
    }
  };

  var _processAnnotations = function (text) {
    var regex = /@ioc-instance\s+["']([^"']+)["']\s*(.*);\s*(@ioc-init\s+["']([^"']+)["']\s*(.*);)*\s*(@ioc-start\s+["']([^"']+)["']\s*(.*);)*\s*\*\/\s*([\w.]+)/g;
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
    if (!ioc.config.context) {
      ioc.config.context = {instances: {}};
    }

    //instance
    ioc.config.context.instances[instanceName] = {namespace: namespace};
    if (match[2]) {
      ioc.config.context.instances[instanceName].args = _processArgAnnotation(match[2]);
    }

    // init
    if (match[4]) {
      ioc.config.context.instances[instanceName].init = {func: match[4]};
      if (match[5]) {
        ioc.config.context.instances[instanceName].init.args = _processArgAnnotation(match[5]);
      }
    }

    // start
    if (match[7]) {
      var start = {instance: instanceName, func: match[7]};
      if (match[8]) {
        start.args = _processArgAnnotation(match[8]);
      }
      if (!ioc.config.context.start) {
        ioc.config.context.start = [];
      }
      ioc.config.context.start.push(start);
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