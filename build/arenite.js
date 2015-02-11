/*!
 * Arenite JavaScript Library v0.0.2
 * https://github.com/lcavadas/arenite
 *
 * Copyright 2014, Luís Serralheiro
 */
/* global Arenite:true */
// Arenite is an implementation of the Sandbox and Module patterns. It was designed to,
// unlike most of the existing module libraries, not affect your code making it dependant on the module library itself.
//
// Base of the arenite sandbox object. Creates the base services in the arenite sandbox object.
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
Arenite = function (config) {
  //### Arenite.Object
  // Instance of the Sandbox is started with the <a href="arenite.object.html">Arenite.Object</a> module witch gives us access to the <code>extend</code> function used.
  var arenite = new Arenite.Object(arenite);
  //### Arenite.Async
  // Extend the instance with the <a href="arenite.async.html">Arenite.Async</a> extension providing the asynchronous tools (Latch Pattern) used by the Loader extension.
  arenite = arenite.object.extend(arenite, new Arenite.Async());
  //### Arenite.Url
  // Extend the instance with the <a href="arenite.url.html">Arenite.Url</a> extension which provides functions for analysis of query parameters.
  arenite = arenite.object.extend(arenite, new Arenite.Url());
  //### Arenite.DI
  // Extend the instance with the <a href="arenite.di.html">Arenite.DI</a> extension which provides
  // the injector functionality.
  arenite = arenite.object.extend(arenite, new Arenite.DI(arenite));
  //### Arenite.Loader
  // Extend the instance with the <a href="arenite.loader.html">Arenite.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  arenite = arenite.object.extend(arenite, new Arenite.Loader(arenite));
  // Initialize the injector by having it read the configuration object passed into this constructor.
  arenite.di.loadConfig(config);
};
/*global Arenite:true*/
//Asynchronous tools
Arenite.Async = function () {
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
/*global Arenite:true*/
/*jshint evil:true*/
Arenite.DI = function (arenite) {

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
        resolved.push(arg.exec(arenite));
      }
    });
    return failure ? null : resolved;
  };

  var _execFunction = function (instance, func, args, callback, extension) {
    var resolvedFunc;
    if (typeof func === 'function') {
      resolvedFunc = func;
    } else {
      if (extension) {
        resolvedFunc = arenite.object.get(arenite[instance], func);
      } else {
        resolvedFunc = arenite.object.get(_getInstance(instance), func);
      }
    }
    if (resolvedFunc) {
      var resolvedArgs = _resolveArgs(args || []);
      if (resolvedArgs) {
        if (typeof callback === 'function') {
          resolvedArgs.push(callback);
        }
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

  var _wire = function (instances, extension) {
    if (!instances) {
      return;
    }

    var instanceKeys = arenite.object.keys(instances);
    var unresolved = {};

    instanceKeys.forEach(function (instance) {
      var func = arenite.object.get(window, instances[instance].namespace);
      if (func) {
        var args = _resolveArgs(instances[instance].args || []);
        if (args) {
          window.console.log(instance, 'wired');
          var actualInstance = instances[instance].factory ? func : func.apply(func, args);
          if (extension) {
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
        if (instances[instance].init.wait) {
          latch.countUp();
          _execFunction(instance, instances[instance].init.func, instances[instance].init.args, function () {
            window.console.log(instance, 'initialized');
            latch.countDown();
          }, extension);
        } else {
          _execFunction(instance, instances[instance].init.func, instances[instance].init.args, null, extension);
          window.console.log(instance, 'initialized');
        }
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
        _execFunction(start.instance, start.func, start.args, start.wait);
      });
    }
  };

  var _loadContext = function () {
    if (arenite.config.context) {
      //Starting must wait for the wiring
      var wireLatch = arenite.async.latch(1, function () {
        window.console.log('start instances');
        _start(arenite.config.context.start);
      }, "instances");

      //wiring of instances must wait for the extensions
      var extensionsLatch = arenite.async.latch(1, function () {
        window.console.log('wire instances');
        _wire(arenite.config.context.instances);
        window.console.log('init instances');
        _init(arenite.config.context.instances, wireLatch);
        wireLatch.countDown();
      }, "extensions");

      window.console.log('wire extensions');
      _wire(arenite.config.context.extensions, true);
      window.console.log('init extensions');
      _init(arenite.config.context.extensions, extensionsLatch, true);
      extensionsLatch.countDown();
    }
  };

  var _loadAsyncDependencies = function (dependencies) {
    var latch = arenite.async.latch(dependencies.async ? dependencies.async.length : 0, _loadContext, 'dependencies');
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
/*global Arenite:true*/
/*jshint evil:true*/
Arenite.Loader = function (arenite) {

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
      arenite.di.processAnnotations(req.responseText);
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
/*global Arenite:true*/
// Collection of utility functions to handle objects.
// This is an integral part for the usage of the Namespace pattern since this provides the ability to, for example,
// retrieve the functions by namespace.
Arenite.Object = function () {

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
/*global Arenite:true*/
//Utility function for interpreting url query parameters
Arenite.Url = function () {
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