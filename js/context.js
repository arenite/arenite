/*global Arenite:true*/
// The context(registry) of the instances.
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