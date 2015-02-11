/*!
 * JIOC JavaScript Library v0.0.2
 * https://github.com/lcavadas/jioc
 *
 * Copyright 2014, Luís Serralheiro
 */
/* global IOC:true */
// IOC is an implementation of the Sandbox and Module patterns. It was designed to,
// unlike most of the existing module libraries, not affect your code making it dependant on the module library itself.
//
// Base of the ioc sandbox object. Creates the base services in the ioc sandbox object.
//
// Using the Namespace and MVP (or MVC) patterns is strongly recommended but not mandatory.
//
// You can create further extensions to the sandbox by providing new services or overriding already imported ones.
//
// There are a few extensions included in this repository and you can read more about them <a href="extensions.html">here</a>.
//
// For more information about the mentioned patterns consult the book "Javascript Patterns"
// by Stoyan Stefanov from O'Reilly Media which discusses these patterns in detail.
//
// ## Configuration
// The documentation for the configuration is presented in the <a href="../index.html">website</a>.
IOC = function (config) {
  //### IOC.Object
  // Instance of the Sandbox is started with the <a href="ioc.object.html">IOC.Object</a> module witch gives us access to the <code>extend</code> function used.
  var ioc = new IOC.Object(ioc);
  //### IOC.Async
  // Extend the instance with the <a href="ioc.async.html">IOC.Async</a> extension providing the asynchronous tools (Latch Pattern) used by the Loader extension.
  ioc = ioc.object.extend(ioc, new IOC.Async());
  //### IOC.Url
  // Extend the instance with the <a href="ioc.url.html">IOC.Url</a> extension which provides functions for analysis of query parameters.
  ioc = ioc.object.extend(ioc, new IOC.Url());
  //### IOC.DI
  // Extend the instance with the <a href="ioc.di.html">IOC.DI</a> extension which provides
  // the injector functionality.
  ioc = ioc.object.extend(ioc, new IOC.DI(ioc));
  //### IOC.Loader
  // Extend the instance with the <a href="ioc.loader.html">IOC.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  ioc = ioc.object.extend(ioc, new IOC.Loader(ioc));
  // Initialize the injector by having it read the configuration object passed into this constructor.
  ioc.di.loadConfig(config);
};
/*global IOC:true*/
//Asynchronous tools
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
      //###Sequencial latch.
      //The sequencial latch will synchronously execute the handler
      // with the provided values and execute a callback when all operations are complete.
      //<pre><code>
      // seqLatch(values, handler, callback)
      //</code></pre>
      // Where *<b>values</b>* is an array of values to be passed as parameters to the handler function.
      // The *<b>handler</b>* function must call the <code>next</code> function of the returned object when it
      // finishes the execution.
      // The *<b>callback</b>* is the function that is executed once all the values have been handled.
      seqLatch: function (values, handler, callback) {
        return new _sequencialLatch(values, handler, callback);
      },
      //###Latch.
      //The latch will execute asynchronous tasks and invoke a callback when all the declared times have been executed
      //<pre><code>
      // latch(times, callback [, name])
      //</code></pre>
      // Where *<b>times</b>* is the initially expected times the latch should wait for to trigger the callback.
      // The *<b>callback</b>* is the function invoked once times reaches 0.
      // The optional *<b></b>*name is if you wish to have a meaningful name in the console logs.
      // This function returns an object with two functions:
      //<pre><code>
      // {
      //   countDown:...
      //   countUp:...
      // }
      //</code></pre>
      // *<b>countDown</b>* will decrease the counter and *<b>CountUp</b>* will increase the counter that is initialized with the times argument.
      // Once the counter hits 0 the callback is invoked.
      latch: function (times, callback, name) {
        return new _latch(times, callback, name);
      }
    }
  };
};
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
        resolved.push(arg.exec(ioc));
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
      window.console.log('wire extensions');
      _wire(ioc.config.context.extensions);
      window.console.log('init extensions');
      _init(ioc.config.context.extensions);
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
/*global IOC:true*/
/*jshint evil:true*/
IOC.Loader = function (ioc) {

  var _loadResource = function (url, callback, error) {
    var req = new window.XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status % 100 < 4) {
          callback(req);
        } else if (typeof error === 'function') {
          error(req);
        }
      }
    };
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.setRequestHeader("Access-Control-Allow-Origin", window.location.origin);
    req.send();
  };

  var _loadScriptWithTag = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.onreadystatechange = function () {
      if (this.readyState === 'complete') {
        callback();
      }
    };
    script.onload = callback;
    script.src = url;
    head.appendChild(script);
  };

  var _loadScriptAsResource = function (url, callback) {
    _loadResource(url, function (req) {
      //analyze the script for "annotation" type configurations
      ioc.di.processAnnotations(req.responseText);
      var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '\n//# sourceURL=' + window.location.origin + '/' + url;
      eval(req.responseText + file_tag);
      callback();
    });
  };

  var _sameOrigin = function (url) {
    var loc = window.location;
    var a = document.createElement('a');
    a.href = url;
    return a.hostname === loc.hostname &&
      a.port === loc.port &&
      a.protocol === loc.protocol;
  };

  var _loadScript = function (url, callback) {
    if (_sameOrigin(url)) {
      _loadScriptAsResource(url, callback);
    } else {
      _loadScriptWithTag(url, callback);
    }
  };

  return {
    loader: {
      loadResource: _loadResource,
      loadScript: _loadScript
    }
  };
};
/*global IOC:true*/
// Collection of utility functions to handle objects.
// This is an integral part for the usage of the Namespace pattern since this provides the ability to, for example,
// retrieve the functions by namespace.
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
      //###object.get
      // Retrieves a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // get(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be fetched.
      get: _getInObject,
      //###object.set
      // Sets a property in an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // set(object, path, value)
      //</pre></code>
      //where *<b>object</b>* is the target object,
      // *<b>path</b>* is the path of the value and *<b>value</b>* the value to be set at the given path.
      set: _setInObject,
      //###object.delete
      // Removes a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // get(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be deleted.
      delete: _deleteInObject,
      //###object.extend
      // Extend merges to objects. The second object will "override" properties also existing in the first.
      //<pre><code>
      // extend(object, other)
      //</pre></code>
      //where *<b>object</b>* is the object to be merged and extended by *<b>other</b>*.
      extend: _extend,
      //###object.keys
      //Returns all the properties available to an object in the form of an array.
      //<pre><code>
      // keys(object)
      //</pre></code>
      //where *<b>object</b>* is the object from which the properties will be extracted.
      keys: _keys,
      //###object.contains
      // Determines if a element is present in an array or a key exists in an object:
      //<pre><code>
      // contains(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      contains: _contains
    },
    array: {
      //###array.contains
      // Determines if a element is present in an array or a key exists in an object:
      //<pre><code>
      // contains(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      contains: _contains,
      //###array.uniq
      // Filters an array returning a new one with the unique values.
      //<pre><code>
      // contains(array)
      //</pre></code>
      //where *<b>array</b>* is the array to be stripped o duplicate values
      uniq: _uniq
    }
  };
};
/*global IOC:true*/
//Utility function for interpreting url query parameters
IOC.Url = function () {
  var query_string;

  var _query = function (force) {
    if (!query_string || force) {
      query_string = {};
      var query = window.location.search.substring(1);
      var vars = query.split("#")[0];
      vars = vars.split("&");
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
    }
    return query_string;
  };

  return {
    url: {
      //### url.query
      // Fetches the query parameters for the current url and returns them in an object.
      // Variables will be keys in the object and the values are either the value for the variable or an array of
      //values in the case where a variable is defined more than once.
      query: _query
    }
  };
};