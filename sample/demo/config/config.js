/*global Arenite:true*/
Arenite.Config = function (arenite) {
  return {
    get: function () {
      return arenite.config;
    }
  };
};