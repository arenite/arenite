/*!
 * Arenite JavaScript Library v0.0.14
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
  // Instance of the Sandbox is started with the <a href="object.html">Arenite.Object</a> module witch gives us access to the <code>extend</code> function used.
  var arenite = new Arenite.Object(arenite);
  //### Arenite.Async
  // Extend the instance with the <a href="async.html">Arenite.Async</a> extension providing the asynchronous tools (Latch Pattern) used by the Loader extension.
  arenite = arenite.object.extend(arenite, new Arenite.Async());
  //### Arenite.Url
  // Extend the instance with the <a href="url.html">Arenite.Url</a> extension which provides functions for analysis of query parameters.
  arenite = arenite.object.extend(arenite, new Arenite.Url());
  //### Arenite.DI
  // Extend the instance with the <a href="di.html">Arenite.DI</a> extension which provides
  // the injector functionality.
  arenite = arenite.object.extend(arenite, new Arenite.DI(arenite));
  arenite = arenite.object.extend(arenite, new Arenite.AnnotationProcessor(arenite));
  arenite = arenite.object.extend(arenite, new Arenite.Context(arenite));
  //### Arenite.Loader
  // Extend the instance with the <a href="loader.html">Arenite.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  arenite = arenite.object.extend(arenite, new Arenite.Loader(arenite));
  // Initialize the injector by having it read the configuration object passed into this constructor.
  arenite.di.init(config);
};

/*global Arenite:true*/
/*jshint evil:true*/
Arenite.AnnotationProcessor = function (arenite) {
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
    annotation: {
      processAnnotations: _processAnnotations
    }
  };

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
Arenite.Context = function (arenite) {
  var registry = {};
  var factories = {};

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
      var args = arenite.di.resolveArgs({factory: true, args: factories[name]});
      if (args) {
        return registry[name].apply(registry[name], args);
      } else {
        throw 'Unable to resolve arguments for "' + name + '"';
      }
    } else {
      return registry[name];
    }
  };

  return {
    context: {
      get: _getInstance,
      add: _addInstance,
      remove: _removeInstance
    }
  };
};
/*global Arenite:true*/
Arenite.DI = function (arenite) {

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
        var tempId = '__anonymous_temp_instance__' + new Date().getTime();
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
          window.console.log('Arenite:', instance, 'wired');
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
    arenite.config.mode = arenite.url.query().env || 'default';
    window.console.log('Arenite: Starting in mode', arenite.config.mode);
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
      init: _boot,
      loadConfig: _loadConfig,
      resolveArgs: _resolveArgs,
      exec: _execFunction
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
      arenite.annotation.processAnnotations(req.responseText);
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

  var _loadScriptFrom = function (url, callback) {
    if (_sameOrigin(url)) {
      _loadScriptAsResource(url, callback);
    } else {
      _loadScriptWithTag(url, callback);
    }
  };

  var _loadScript = function (script, done) {
    if (typeof script === 'string') {
      _loadScriptFrom(script, done);
    } else {
      _loadScriptFrom(script.url, function () {
        arenite.object.keys(script.instances).forEach(function (instance) {
          arenite.context.add(instance, window[script.instances[instance]]);
          delete window[script.instances[instance]];
        });
        if (typeof done === 'function') {
          done();
        }
      });
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

  var _merge = function (arr1, arr2, keepDups) {
    var result = [];
    arr1.forEach(function (el) {
      result.push(el);
    });
    arr2.forEach(function (el) {
      result.push(el);
    });
    return keepDups ? result : _uniq(result);
  };

  var _extract = function (obj, prop) {
    var result = [];
    for (var _key in obj) {
      if (obj.hasOwnProperty(_key)) {
        result.push(obj[_key][prop]);
      }
    }
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
      uniq: _uniq,
      //###array.merge
      // Merges two arrays returning a new one with the unique values.
      //<pre><code>
      // merge(arr1, arr2)
      //</pre></code>
      //where *<b>arr1</b>* and *<b>arr2</b>* are the arrays to be merged
      merge: _merge,
      extract: _extract
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