/*global IOC:true*/
IOC.Config = function (ioc) {
  return {
    get: function () {
      return ioc.config;
    }
  };
};