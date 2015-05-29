/*!
 * Arenite JavaScript Library v1.0.1
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
  arenite = arenite.object.extend(arenite, new Arenite.Async(arenite));
  //### Arenite.Url
  // Extend the instance with the <a href="url.html">Arenite.Url</a> extension which provides functions for analysis of query parameters.
  arenite = arenite.object.extend(arenite, new Arenite.Url(arenite));
  //### Arenite.DI
  // Extend the instance with the <a href="di.html">Arenite.DI</a> extension which provides
  // the injector functionality.
  arenite = arenite.object.extend(arenite, new Arenite.DI(arenite));
  //### Arenite.AnnotationProcessor
  // Extend the instance with the <a href="annotation.html">Arenite.AnnotationProcessor</a> extension which provides
  // the parsing and hanlding of annotations.
  arenite = arenite.object.extend(arenite, new Arenite.AnnotationProcessor(arenite));
  //### Arenite.Context
  // Extend the instance with the <a href="context.html">Arenite.Context</a> extension which provides
  // the context to manage the instances.
  arenite = arenite.object.extend(arenite, new Arenite.Context(arenite));
  //### Arenite.Loader
  // Extend the instance with the <a href="loader.html">Arenite.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  arenite = arenite.object.extend(arenite, new Arenite.Loader(arenite));
  // Initialize the injector by having it read the configuration object passed into this constructor.
  arenite.di.init(config);
  return arenite;
};

/*global Arenite:true*/
/*jshint evil:true*/
// Utility function to interpret the annotations.
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
      //###annotation.processAnnotations
      // Interpret the annotations specified in a given source.
      //<pre><code>
      // processAnnotations(text)
      //</pre></code>
      //where *<b>text</b>* is the text(source) to be analysed
      processAnnotations: _processAnnotations
    }
  };

};
/*global Arenite:true*/
//Asynchronous tools
Arenite.Async = function (arenite) {
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
    var executions = 0;
    var id = name || new Date().getTime();

    if (arenite.config.debug) {
      window.console.groupCollapsed('Latch: Starting latch "' + id + '" for', times, 'times');
      window.console.trace();
      window.console.groupEnd();
    }

    return {
      countDown: function () {
        executions++;
        if (arenite.config.debug) {
          window.console.log('Latch: Counting down latch "' + id + '" ,', times - executions, 'remaining');
        }
        if (executions === times) {
          if (arenite.config.debug) {
            window.console.log('Latch: Triggering latch "' + id + '"');
          }
          callback(executions);
        }
      },
      countUp: function () {
        executions--;
        if (arenite.config.debug) {
          window.console.log('Latch: Counting up latch "' + id + '" ,', times - executions, 'remaining');
        }
        if (executions === times) {
          if (arenite.config.debug) {
            window.console.log('Latch: Triggering latch "' + id + '"');
          }
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
// The context(registry) of the instances.
Arenite.Context = function (arenite) {
  var registry = {};
  var factories = {};
  var factory_id = 1;

  var _addInstance = function (name, instance, factory) {
    if (factory) {
      factories[name] = instance;
    } else {
      registry[name] = instance;
    }
  };

  var _removeInstance = function (name) {
    arenite.object.delete(registry, name);
  };

  var _getInstance = function (name) {
    if (factories.hasOwnProperty(name)) {
      var tempId = '__factory_instance_' + name + '__' + factory_id++;
      var tempContext = {};
      tempContext[tempId] = arenite.object.extend(factories[name], {factory: false});
      arenite.di.wire(tempContext);
      var instance = registry[tempId];
      _removeInstance(tempId);
      return instance;
    } else {
      return registry[name];
    }
  };

  return {
    context: {
      //###context.get
      // Get an registered instance from arenite.
      //<pre><code>
      // get(instance)
      //</pre></code>
      //where *<b>instance</b>* is the name of the instance to be retrieved
      get: _getInstance,
      //###context.add
      // Register an instance in arenite
      //<pre><code>
      // add(name, instance, factory, args)
      //</pre></code>
      //where *<b>name</b>* is the alias by which the instance should be known, *<b>instance</b>* is the actual instance
      // to register or the factory function in case it's a factory, *<b>factory</b>* is a flag stating if a new
      // instance should be generated each time it is requested and *<b>args</b>* is the arguments to use in case
      // the instance is a factory.
      add: _addInstance,
      //###context.remove
      // Removes an instance from the arenite context
      //<pre><code>
      // remove(instance)
      //</pre></code>
      //where *<b>instance</b>* is the name of the instance to be de-registered from arenite.
      remove: _removeInstance
    }
  };
};
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
        arenite.context.remove(tempId);
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
          var args = _resolveArgs(instances[instance]);
          if (args) {
            var actualInstance = instances[instance].factory ? func : func.apply(func, args);
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

  var _wireFactory = function (instances) {
    _wire(instances);
    _init(instances);
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
/*global Arenite:true*/
/*jshint evil:true*/
// Collection of utility functions to handle loading resources.
Arenite.Loader = function (arenite) {

  var _createCORSRequest = function (method, url) {
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest !== 'undefined') {
      xhr = new XDomainRequest();
      xhr.open(method, url);
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.setRequestHeader("Access-Control-Allow-Origin", window.location.origin);
    } else {
      xhr = null;
    }
    if (arenite.config.withCredentials && xhr.withCredentials) {
      xhr.withCredentials = true;
    }
    return xhr;
  };

  var _loadResource = function (url, callback, error) {
    var req = _createCORSRequest('GET', url);
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

  var _loadScriptWithTag = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    if (navigator.appVersion.indexOf("MSIE 9") === -1) { //IE 9 calls the callback twice
      script.onreadystatechange = function () {
        if (this.readyState === 'complete') {
          callback();
        }
      };
    }
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
          if (typeof script.init === 'function') {
            script.init(arenite);
          }
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
      //###loader.loadResource
      // Load a given resource using ajax.
      //<pre><code>
      // loadResource(url, callback, error)
      //</pre></code>
      //where *<b>url</b>* is the url to fetch from,  *<b>callback</b>* is a function called with the ajax request after
      // it's succesful completion and *<b>error</b>* is an optional callback to handle errors when fetching the resource
      loadResource: _loadResource,
      //###loader.loadScript
      // Load a script. This method will choose the best method to load the script (using tag or ajax) depending on the
      // origin of the script. Additionally it can extract variables exposed in the window object and register them as
      // instances in arenite.
      //<pre><code>
      // loadScript(script, callback)
      //</pre></code>
      //where *<b>script</b>* is either a url string or a structure defining a url and instances to be extracted from
      // the window object into arenite and *<b>callback</b>* is the callback for when the script is loaded.
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
      //###array.extract
      // Extract an array composed of a specified property of the subobjects of a given object
      //<pre><code>
      // extract(object, property)
      //</pre></code>
      //where *<b>object</b>* is the object whose members will be analysed *<b>property</b>* the property to be extracted from those members
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
