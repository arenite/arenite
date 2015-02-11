/*global Arenite:true*/
Arenite.Config = function (arenite) {
  return {
    get: function () {
      window.console.log('Config: get');
      return arenite.config;
    }
  };
};