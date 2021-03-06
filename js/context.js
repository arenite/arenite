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
      if (dep === 'exports') { //reserved name for Simplified CommonJS wrapper
        resolvedDeps.push({});
      } else if (dep === 'require') { //reserved name for Simplified CommonJS wrapper
        resolvedDeps.push(_getInstance);
      } else {
        resolvedDeps.push(_getInstance(dep));
      }
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
      //### context.get
      // Get an registered instance from arenite.
      //<pre><code>
      // get(instance)
      //</pre></code>
      //where *<b>instance</b>* is the name of the instance to be retrieved
      get: _getInstance,
      //### context.add
      // Register an instance in arenite
      //<pre><code>
      // add(name, instance, factory, args)
      //</pre></code>
      //where *<b>name</b>* is the alias by which the instance should be known, *<b>instance</b>* is the actual instance
      // to register or the factory function in case it's a factory, *<b>factory</b>* is a flag stating if a new
      // instance should be generated each time it is requested and *<b>args</b>* is the arguments to use in case
      // the instance is a factory.
      add: _addInstance,
      //### context.remove
      // Removes an instance from the arenite context
      //<pre><code>
      // remove(instance)
      //</pre></code>
      //where *<b>instance</b>* is the name of the instance to be de-registered from arenite.
      remove: _removeInstance
    }
  };
};
