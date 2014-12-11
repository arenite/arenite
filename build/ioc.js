/* global IOC:true */
IOC = function (config) {
  var ioc = new IOC.Object(ioc);
  ioc = ioc.object.extend(ioc, new IOC.Loader());
  ioc = ioc.object.extend(ioc, new IOC.Async());
  ioc = ioc.object.extend(ioc, new IOC.Url());
  ioc = ioc.object.extend(ioc, new IOC.DI(ioc));
  ioc.di.loadConfig(config);
};
/*global IOC:true*/
IOC.Async = function () {
  var _sequencialLatch = function (values, callback, finalCallback) {
    var index = 0;
    var length = values.length;

    var _next = function () {
      if (index < length) {
        callback(values[index++]);
      } else {
        finalCallback();
      }
    };

    return {
      next: _next
    };
  };

  var _latch = function (times, callback, name) {
    var id = name || new Date().getTime();
    window.console.groupCollapsed('Latch: Starting latch "' + id + '" for', times, 'times');
    window.console.trace();
    window.console.groupEnd();
    var executions = 0;
    return {
      countDown: function () {
        executions++;
        window.console.log('Latch: Counting down latch "' + id + '" ,', times - executions, 'remaining');
        if (executions === times) {
          window.console.log('Latch: Triggering latch "' + id + '"');
          callback(executions);
        }
      },
      countUp: function () {
        executions--;
        window.console.log('Latch: Counting up latch "' + id + '" ,', times - executions, 'remaining');
        if (executions === times) {
          window.console.log('Latch: Triggering latch "' + id + '"');
          callback(executions);
        }
      }
    };
  };

  return {
    async: {
      seqLatch: function (values, handler, callback) {
        return _sequencialLatch(values, handler, callback);
      },
      latch: function (times, callback, name) {
        return new _latch(times, callback, name);
      }
    }
  };
};
/*global IOC:true*/
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
      factories[name] = args || [];
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
      ioc.loader.loadScript(url, seqLatch.next);
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
        ioc.loader.loadScript(dep, latch.countDown);
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
        ioc.loader.loadScript(subImp.url, latch.countDown);
      });
    } else {
      _loadDependencies();
    }
  };

  var _loadConfig = function (config) {
    ioc.di.addInstance('ioc', ioc);
    ioc.config = config;
    ioc.config.mode = ioc.url.query().env || 'default';
    window.console.log('IOC: Starting in mode', ioc.config.mode);
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
/*global IOC:true*/
IOC.Loader = function () {
  var _loadScript = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = script.onload = function () {
      window.console.log('IOC: Loaded', url);
      if (typeof callback === 'function') {
        callback();
      }
    };
    window.console.log('IOC: Loading', url);
    head.appendChild(script);
  };

  var _loadResource = function (url, callback, error) {
    var req = new window.XMLHttpRequest();
    req.open('GET', url);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status % 100 < 4) {
          callback(req);
        } else if (typeof error === 'function') {
          error(req);
        }
      }
    };
    req.send();
  };

  return {
    loader: {
      loadResource: _loadResource,
      loadScript: _loadScript
    }
  };
};

/*global IOC:true*/
IOC.Object = function () {

  var _navigateToBeforeLast = function (object, path) {
    if (!object) {
      return;
    }

    var split = path.split(".");
    var last = split.splice(split.length - 1, 1);

    var result = object;
    split.forEach(function (pathEl) {
      if (!result) {
        return;
      }
      if (!result[pathEl]) {
        result[pathEl] = {};
      }
      result = result[pathEl];
    });
    return {object: result, path: last};
  };

  var _getInObject = function (object, path) {
    if (!object) {
      return;
    }

    var split = path.split(".");
    var result = object;
    split.forEach(function (pathEl) {
      if (!result) {
        return;
      }
      result = result[pathEl];
    });
    return result;
  };

  var _setInObject = function (object, path, element) {
    var beforeLast = _navigateToBeforeLast(object, path);
    if (beforeLast && beforeLast.object) {
      beforeLast.object[beforeLast.path] = element;
      return beforeLast.object[beforeLast.path];
    }
  };

  var _deleteInObject = function (object, path) {
    var beforeLast = _navigateToBeforeLast(object, path);
    if (beforeLast && beforeLast.object) {
      delete beforeLast.object[beforeLast.path];
    }
  };

  var _extend = function (source, target) {
    for (var f in target) {
      if (target.hasOwnProperty(f)) {
        if (source[f] && typeof source[f] === 'object') {
          if (source[f].constructor === Array && target[f].constructor === Array) {
            source[f] = _uniq(source[f].concat(target[f]));
          } else {
            _extend(source[f], target[f]);
          }
        } else {
          source[f] = target[f];
        }
      }
    }
    return source;
  };

  var _keys = function (obj) {
    var keys = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  var _contains = function (obj, key) {
    if (obj.length) {
      var result = false;
      obj.forEach(function (_key) {
        result = result || _key === key;
      });
      return result;
    } else {
      for (var _key in obj) {
        if (obj.hasOwnProperty(_key)) {
          if (_key === key) {
            return true;
          }
        }
      }
    }
    return false;
  };

  var _uniq = function (arr) {
    var result = [];
    arr.forEach(function (el) {
      if (result.indexOf(el) < 0) {
        result.push(el);
      }
    });
    return result;
  };

  return {
    object: {
      get: _getInObject,
      set: _setInObject,
      delete: _deleteInObject,
      extend: _extend,
      keys: _keys
    },
    array: {
      contains: _contains,
      uniq: _uniq
    }
  };
};
/*global IOC:true*/
IOC.Url = function () {
  return {
    url: {
      query: function () {
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split("=");
          if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
          } else if (typeof query_string[pair[0]] === "string") {
            query_string[pair[0]] = [query_string[pair[0]], pair[1]];
          } else {
            query_string[pair[0]].push(pair[1]);
          }
        }
        return query_string;
      }
    }
  };
};