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
      var args = arenite.di.resolveArgs({args: factories[name]});
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