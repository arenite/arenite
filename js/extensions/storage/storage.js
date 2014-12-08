/*global IOC:true*/
IOC.Storage = function (ioc) {

  var _local;
  var _session;
  var _persistant;

  var _init = function (cb) {
    if (_local !== null) {

      var latch = ioc.async.latch(3, cb, 'storage');

      window.storage(function (sjs) {
        _local = sjs;
        latch.countDown();
      }, 'LocalStorage');

      window.storage(function (sjs) {
        _session = sjs;
        latch.countDown();
      }, 'SessionStorage');

      window.storage(function (sjs) {
        _persistant = sjs;
        latch.countDown();
      });
    }
  };

  return {
    init: _init,
    localStore: function () {
      return _local;
    },
    sessionStore: function () {
      return _session;
    },
    persistantStore: function () {
      return _persistant;
    }
  };
};