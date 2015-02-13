/*global Arenite:true*/
Arenite.Router = function (arenite) {

  var _routes = {};

  var _handleChange = function () {
    var hash = window.location.hash;
    arenite.object.keys(_routes).forEach(function (route) {
      var args = _routes[route].regex.exec(hash);
      if (args) {
        window.console.log('Arenite.Router: Executing route "' + route + '"');
        _routes[route].executions.forEach(function (execution) {
          var exec = JSON.parse(JSON.stringify(execution));
          if (!exec.args) {
            exec.args = [];
          }
          args.forEach(function (arg) {
            exec.args.push({value: arg});
          });
          arenite.di.exec(exec);
        });
      }
    });
  };

  var _init = function (routes, passive) {
    if (!passive) {
      document.body.onhashchange = _handleChange;
    }
    arenite.object.keys(routes).forEach(function (route) {
      var regex = route.replace(/:\w+/g, '(\\w+)');
      _routes[route] = {executions: routes[route], regex: new RegExp(regex)};
    });
    arenite.config.context.start.push({func: _handleChange});
  };

  return {
    init: _init
  };
};