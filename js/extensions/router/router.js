/*global Arenite:true*/
Arenite.Router = function (arenite) {

  var _routes = {};

  var _trigger = function (hash, updateHash) {
    if (hash.indexOf('#') !== 0) {
      hash = '#' + hash;
    }
    arenite.object.keys(_routes).forEach(function (route) {
      var args = _routes[route].regex.exec(hash);
      if (args) {
        args.splice(0, 1);
        _executeRoute(route, args, updateHash ? hash : updateHash);
      }
    });
  };

  var _executeRoute = function (route, args, updateHash) {
    _routes[route].executions.forEach(function (execution) {
      var exec = JSON.parse(JSON.stringify(execution));
      if (typeof execution.func === 'function') {
        exec.func = execution.func;
        exec.args = [{ref: 'arenite'}];
      }
      if (!exec.args) {
        exec.args = [];
      }
      args.forEach(function (arg) {
        exec.args.push({value: arg});
      });
      window.console.log('Arenite.Router: Executing route "' + route + '" with:', exec);
      if (updateHash) {
        window.location.hash = updateHash;
      }
      arenite.di.exec(exec);
    });
  };

  var _handleChange = function () {
    _trigger(window.location.hash);
  };

  var _init = function (routes, passive) {
    if (!passive) {
      document.body.onhashchange = _handleChange;
    }
    arenite.object.keys(routes).forEach(function (route) {
      _add(route, routes[route]);
    });
    arenite.config.context.start.splice(0, 0, {func: _handleChange});
  };

  var _add = function (route, executions) {
    var regex = '^#' + route.replace(/:\w+/g, '(\\w+)') + "$";
    _routes[route] = {executions: executions, regex: new RegExp(regex)};
  };

  var _remove = function (route) {
    delete _routes[route];
  };

  return {
    init: _init,
    add: _add,
    remove: _remove,
    trigger: _trigger
  };
};