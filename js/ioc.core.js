/* global IOC:true */
IOC = function (config) {
  var ioc = new IOC.Object(ioc);
  ioc = ioc.object.extend(ioc, new IOC.Async());
  ioc = ioc.object.extend(ioc, new IOC.Url());
  ioc = ioc.object.extend(ioc, new IOC.DI(ioc));
  ioc = ioc.object.extend(ioc, new IOC.Loader(ioc));
  ioc.di.loadConfig(config);
};