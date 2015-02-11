/*global Arenite:true*/
Arenite.Echo = function (arg) {
  window.console.log('echo:', arg);
  return {
    init: function () {
      window.console.log('echo: init');
    }
  };
};