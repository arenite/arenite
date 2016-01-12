/*!
 * Arenite JavaScript Library v2.0.0-rc2
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
  var arenite = Arenite.Object();
  // Add the object and array helper methods to their respective prototypes
  arenite.object.forEach(arenite.object, function (func, name) {
    if (!Object.prototype[name]) {
      Object.defineProperty(Object.prototype, name, {
        writable: true,
        enumerable: false,
        value: function () {
          return func.apply(this, [this].concat([].slice.call(arguments)));
        }
      });
    }
  });

  arenite.object.forEach(arenite.array, function (func, name) {
    if (!Array.prototype[name]) {
      Object.defineProperty(Array.prototype, name, {
        writable: true,
        enumerable: false,
        value: function () {
          return func.apply(this, [this].concat([].slice.call(arguments)));
        }
      });
    }
  });
  //### Arenite.Html
  // Extend the instance with the <a href="async.html">Arenite.Html</a> extension providing the html helper tooks.
  arenite.fuseWith(Arenite.Html(arenite));
  //### Arenite.Async
  // Extend the instance with the <a href="async.html">Arenite.Async</a> extension providing the asynchronous tools (Latch Pattern) used by the Loader extension.
  arenite.fuseWith(Arenite.Async(arenite));
  //### Arenite.Url
  // Extend the instance with the <a href="url.html">Arenite.Url</a> extension which provides functions for analysis of query parameters.
  arenite.fuseWith(Arenite.Url(arenite));
  //### Arenite.DI
  // Extend the instance with the <a href="di.html">Arenite.DI</a> extension which provides
  // the injector functionality.
  arenite.fuseWith(Arenite.DI(arenite));
  //### Arenite.AnnotationProcessor
  // Extend the instance with the <a href="annotation.html">Arenite.AnnotationProcessor</a> extension which provides
  // the parsing and hanlding of annotations.
  arenite.fuseWith(Arenite.AnnotationProcessor(arenite));
  //### Arenite.Context
  // Extend the instance with the <a href="context.html">Arenite.Context</a> extension which provides
  // the context to manage the instances.
  arenite.fuseWith(Arenite.Context(arenite));
  //### Arenite.Loader
  // Extend the instance with the <a href="loader.html">Arenite.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  arenite.fuseWith(Arenite.Loader(arenite));
  //### Arenite.Bus
  // Extend the instance with the <a href="bus.html">Arenite.Bus</a> extension which provides
  // an event bus.
  arenite.fuseWith(Arenite.Bus(arenite));
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
        callback(values[index], index++);
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
      seqLatch: _sequencialLatch,
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
      latch: _latch
    }
  };
};
/*global Arenite:true*/
Arenite.Bus = function () {
  var bus = {};

  var _subscribe = function (subject, func) {
    if (!bus[subject]) {
      bus[subject] = [];
    }
    bus[subject].push(func);
  };

  var _unsubscribe = function (subject, func) {
    if (bus[subject]) {
      bus[subject].forEach(function (handler, idx) {
        if (handler === func) {
          bus[subject].splice(idx, 1);
        }
      });
    }
  };

  var _publish = function (subject, args) {
    window.console.groupCollapsed("sending event:\"" + subject + "\" with ", args);
    window.console.trace();
    window.console.groupEnd();
    if (bus[subject]) {
      bus[subject].forEach(function (handler) {
        window.setTimeout(function () { //make the calls asynchronous
          handler(args);
        }, 0);
      });
    }
  };

  return {
    bus: {
      subscribe: _subscribe,
      unsubscribe: _unsubscribe,
      publish: _publish
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
    registry.deleteInPath(name);
  };

  var _getInstance = function (name) {
    if (factories.hasOwnProperty(name)) {
      var tempId = '__factory_instance_' + name + '__' + factory_id++;
      var tempContext = {};
      tempContext[tempId] = factories[name].fuseWith({factory: false});
      arenite.di.wire(tempContext);
      var instance = registry[tempId];
      _removeInstance(tempId);
      return instance;
    } else {
      return registry[name];
    }
  };

  /* AMD methods declaration so we can capture the libs that support it */
  window.require = _getInstance;
  window.define = function (name, deps, callback) {
    while (!Array.isArray(deps)) {
      callback = deps;
      deps = typeof name === 'function' || Array.isArray(name) ? name : [];
      name = typeof name === 'string' ? name : undefined;
    }

    var resolvedDeps = [];
    deps.forEach(function (dep) {
      resolvedDeps.push(_getInstance(dep));
    });
    var result = callback.apply(window, resolvedDeps);
    if (!name) {
      try {
        throw new Error();
      } catch (e) {
        var reg = /([^\/]+?)(\.min)*\.js[:\d]+\)*$/gm;
        if (reg.exec(e.stack)) {
          var candidates = reg.exec(e.stack);
          if (candidates.length > 1) {
            name = candidates[1];
          }
        }
      }
    }
    if (name) {
      _addInstance(name, result);
    }
  };
  window.define.amd = {
    jQuery: true
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
        resolvedFunc = arenite[execution.instance].getInPath(execution.func);
      } else {
        resolvedFunc = arenite.context.get(execution.instance).getInPath(execution.func);
      }
    }
    return resolvedFunc;
  };

  var _resolveArgs = function (execution, done, type, stack) {
    execution.args = execution.args || [];
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
          if (arenite.debug) {
            window.console.log('Arenite: Failed to resolve arg', arg);
          }
        }
      } else if (typeof arg.func !== 'undefined') {
        resolved.push(arg.func);
      } else if (typeof arg.exec !== 'undefined') {
        resolved.push(arg.exec(arenite));
      } else if (typeof arg.instance !== 'undefined') {
        var anonymousContext = {instances: {}};
        var tempId = '__anonymous_temp_instance__' + anonymous_id++;
        anonymousContext.instances[tempId] = arg.instance;
        _loadContext(anonymousContext, stack);
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

  var _execFunction = function (execution, before, done, stack) {
    var resolvedFunc = _resolveFunc(execution);
    if (resolvedFunc) {
      var resolvedArgs = _resolveArgs(execution, done, undefined, stack);
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

  var _wire = function (instances, type, stack) {
    if (!instances) {
      return;
    }

    var unresolved = {};

    instances.toKeyArray().forEach(function (instance) {
      if (instances[instance].factory) {
        arenite.context.add(instance, instances[instance], true);
      } else {
        var func = window.getInPath(instances[instance].namespace);
        if (func) {
          var args = _resolveArgs(instances[instance], null, type, [instance]);
          if (args) {
            var actualInstance = func.apply(func, args);
            if (type === 'extension') {
              var wrappedInstance = {};
              wrappedInstance[instance] = actualInstance;
              arenite = arenite.fuseWith(wrappedInstance);
            }
            if (arenite.debug) {
              window.console.log('Arenite: Instance', instance, 'wired');
            }
            arenite.context.add(instance, actualInstance);

          } else {
            unresolved[instance] = instances[instance];
          }
        } else {
          throw 'Unknown function "' + instances[instance].namespace + '"';
        }
      }
    });

    if (unresolved.toKeyArray().length !== instances.toKeyArray().length && unresolved.toKeyArray().length > 0) {
      unresolved.forEach(function (instance, name) {
        var instanceObj = {};
        instanceObj[name] = instance;
        _wire(instanceObj, undefined, stack.concat(name));
      });
    } else {
      if (unresolved.toKeyArray().length !== 0) {
        throw 'Make sure you don\'t have circular dependencies, Unable to resolve the following instances: ' + unresolved.toKeyArray().join(", ") + ' - [' + stack.join(', ') + ']';
      }
    }
  };

  var _init = function (instances, latch, extension) {
    if (!instances) {
      return;
    }
    instances.forEach(function (instance, instanceName) {
      if (instance.init && !instance.factory) {
        if (typeof instance.init === 'string') {
          instance.init = {func: instance.init};
        }
        _execFunction(({
          instance: instanceName,
          extension: extension
        }).fuseWith(instance.init), function () {
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

  var _loadContext = function (context, stack) {
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
        _wire(context.instances, undefined, stack || []);
        _init(context.instances, wireLatch);
        wireLatch.countDown();
      }, "extensions");

      _wire(context.extensions, 'extension', stack || []);
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

  var _externalUrl = /^((http:\/\/)|(http:\/\/)|(\/\/)).*$/;
  var _prodModuleVersion = /[\d]+\.[\d]+\.*[\d]*/;
  var _devRepo = '//rawgit.com/{vendor}/{version}/{module}/';
  var _prodRepo = '//cdn.rawgit.com/{vendor}/{version}/{module}/';

  var _fetchModules = function (modules, callback) {
    if (modules.toKeyArray().length) {
      var latch = arenite.async.latch(modules.toKeyArray().length, callback, 'modules');
      modules.forEach(function (module) {
        var mode = module.vendor ? module.mode ? module.mode : 'default' : arenite.config.mode;
        var moduleBasePath;
        if (module.vendor) {
          if (arenite.config.repo) {
            moduleBasePath = arenite.config.repo.replace('{vendor}', module.vendor);
          } else if (module.version.match(_prodModuleVersion)) {
            moduleBasePath = _prodRepo.replace('{vendor}', module.vendor);
          } else {
            moduleBasePath = _devRepo.replace('{vendor}', module.vendor);
          }
          moduleBasePath = moduleBasePath.replace('{version}', module.version);
          moduleBasePath = moduleBasePath.replace('{module}', module.module);
        } else {
          moduleBasePath = module.module + '/';
        }

        arenite.loader.loadResource(moduleBasePath + 'module.json', function (xhr) {
          var moduleConf = JSON.parse(xhr.responseText);
          var newDeps = {async: [], sync: []};
          (moduleConf.context.dependencies[mode] || {}).forEach(function (dependencies, depType) {
            dependencies.forEach(function (dep) {
              if (typeof dep === 'string') {
                newDeps[depType].push(dep.match(_externalUrl) || !module.vendor ? dep : moduleBasePath + dep);
              } else {
                newDeps[depType].push(dep.fuseWith({url: dep.url.match(_externalUrl) || !module.vendor ? dep.url : moduleBasePath + dep.url}));
              }
            });
          });
          delete moduleConf.context.dependencies;

          arenite.config.context = arenite.config.context || {};
          arenite.config.context.dependencies = arenite.config.context.dependencies || {
              default: {
                sync: [],
                async: []
              }
            };
          arenite.config.context.dependencies[arenite.config.mode] = arenite.config.context.dependencies[arenite.config.mode] || {
              sync: [],
              async: []
            };
          arenite.config.context.dependencies.forEach(function (env) {
            env.fuseWith(newDeps);
          });

          arenite.config = arenite.config.fuseWith(moduleConf);
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
    arenite.config.mode = arenite.config.mode || arenite.url.query().mode || 'default';
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
      window.console.log('Arenite: Fetching modules', arenite.config.imports.toKeyArray());
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
    _wire(instances, 'factory', []);
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

/*global Arenite:true*/
// Collection of utility functions to handle html.
Arenite.Html = function (arenite) {

  var _escape = function (text) {
    var span = document.createElement('span');
    span.innerText = text;
    return span.innerHTML;
  };

  var _unescape = function (text) {
    var span = document.createElement('span');
    span.innerHTML = text;
    return span.innerText;
  };

  return {
    html: {
      escape: _escape,
      unescape: _unescape
    }
  };
};
/*global Arenite:true*/
/*jshint evil:true*/
// Collection of utility functions to handle loading resources.
Arenite.Loader = function (arenite) {

  var firefoxOs = navigator.userAgent.indexOf('Firefox') > -1 && navigator.userAgent.indexOf("Mobile") > -1;

  var _createCORSRequest = function (method, url, success, failure) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    //xhr.setRequestHeader("Access-Control-Allow-Origin", window.location.origin);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status % 100 < 4) {
          success();
        } else {
          failure();
        }
      }
    };
    if (arenite.config.withCredentials) {
      xhr.withCredentials = true;
    }
    return xhr;
  };

  var _loadResource = function (url, callback, error) {
    var req = _createCORSRequest('GET', url, function () {
      callback(req);
    }, function () {
      if (typeof error === 'function') {
        error(req);
      }
    });
    req.send();
  };

  var _loadStyleWithTag = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('link');
    script.rel = 'stylesheet';
    script.type = 'text/css';
    if (navigator.appVersion.indexOf("MSIE 9") === -1) { //IE 9 calls the callback twice
      script.onreadystatechange = function () {
        if (this.readyState === 'complete') {
          callback();
        }
      };
    }
    script.onload = callback;
    script.href = url;
    head.appendChild(script);
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
    var fileExt = url.match(/.*\.(\w+)\?*.*/)[1];
    if (_sameOrigin(url) && !firefoxOs && fileExt === 'js') {
      _loadScriptAsResource(url, callback);
    } else {
      if (fileExt === 'js') {
        _loadScriptWithTag(url, callback);
      } else if (fileExt === 'css') {
        _loadStyleWithTag(url, callback);
      } else {
        throw 'Uknown extension "' + fileExt + '"';
      }
    }
  };

  var _loadScript = function (script, done) {
    if (typeof script === 'string') {
      _loadScriptFrom(script, done);
    } else {
      _loadScriptFrom(script.url, function () {
        script.instances.forEach(function (instance, instanceName) {
          arenite.context.add(instanceName, window[instance]);
          delete window[instance];
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
          if (source[f].constructor === Array && target[f] && target[f].constructor === Array) {
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

  var _merge = function (arr1, arr2) {
    return _uniq(arr1.concat(arr2));
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

  var _obj = function (arr, key) {
    var obj = {};
    arr.forEach(function (elem) {
      obj[_getInObject(elem, key)] = elem;
    });
    return obj;
  };

  var _forEach = function (obj, func) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        func(obj[key], key);
      }
    }
  };

  var _array = function (obj) {
    var arr = [];
    _forEach(obj, function (el) {
      arr.push(el);
    });
    return arr;
  };

  var _filter = function (obj, keys) {
    var filtered = {};
    keys.forEach(function (key) {
      if (obj.hasOwnProperty(key)) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  };

  return {
    object: {
      //###object.getFromPath
      // Retrieves a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // getFromPath(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be fetched.
      getInPath: _getInObject,
      //###object.setInPath
      // Sets a property in an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // setInPath(object, path, value)
      //</pre></code>
      //where *<b>object</b>* is the target object,
      // *<b>path</b>* is the path of the value and *<b>value</b>* the value to be set at the given path.
      setInPath: _setInObject,
      //###object.deleteInPath
      // Removes a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // deleteInPath(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be deleted.
      deleteInPath: _deleteInObject,
      //###object.fuseWith
      // Fuse merges objects. The second object will "override" properties also existing in the first.
      //<pre><code>
      // fuseWith(object, other)
      //</pre></code>
      //where *<b>object</b>* is the object to be merged and extended by *<b>other</b>*.
      fuseWith: _extend,
      //###object.keysOf
      //Returns all the properties available to an object in the form of an array.
      //<pre><code>
      // keysOf(object)
      //</pre></code>
      //where *<b>object</b>* is the object from which the properties will be extracted.
      toKeyArray: _keys,
      //###object.forEach
      //Iterates through the object the equivalent to the way forEach works for arrays.
      //<pre><code>
      // forEach(object, func(elem, key))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      forEach: _forEach,
      //###object.containsKey
      // Determines if a key exists in an object:
      //<pre><code>
      // containsKey(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      containsKey: _contains,
      //###object.toArray
      // Transforms the object to an array using the values for each key:
      //<pre><code>
      // toArray(object)
      //</pre></code>
      //where *<b>object</b>* is the object to be transformed into the array.
      toArray: _array,
      //###object.filterWith
      // Returns a filtered version of the object:
      //<pre><code>
      // filterWith(object, keys)
      //</pre></code>
      //where *<b>object</b>* is the object to be filtered and *<b>keys</b>* an array of keys to maintain.
      filterWith: _filter
    },
    array: {
      //###array.containsElement
      // Determines if a element is present in an array:
      //<pre><code>
      // containsElement(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      containsElement: _contains,
      //###array.filterUnique
      // Filters an array returning a new one with the unique values.
      //<pre><code>
      // filterUnique(array)
      //</pre></code>
      //where *<b>array</b>* is the array to be stripped o duplicate values
      filterUnique: _uniq,
      //###array.mergeWith
      // Merges two arrays returning a new one with the unique values.
      //<pre><code>
      // mergeWith(arr1, arr2)
      //</pre></code>
      //where *<b>arr1</b>* and *<b>arr2</b>* are the arrays to be merged
      mergeWith: _merge,
      //###array.toArrayOf
      // Extract an array composed of a specified property of the subobjects of a given object
      //<pre><code>
      // toArrayOf(object, property)
      //</pre></code>
      //where *<b>object</b>* is the object whose members will be analysed *<b>property</b>* the property to be extracted from those members
      toArrayOf: _extract,
      //###array.toObject
      // Extract an object indexed by a given key
      //<pre><code>
      // toObject(array, property)
      //</pre></code>
      //where *<b>array</b>* is the array whose members will be analysed *<b>property</b>* the property of each element to be turned into the key of that element in the resulting object
      toObject: _obj
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