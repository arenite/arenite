/*global Arenite:true*/
Arenite.Storage = function (arenite, storage) {

  var _local;
  var _session;
  var _persistent;

  var _init = function (cb) {
    if (_local !== null) {

      var latch = arenite.async.latch(3, function () {
        if (typeof cb === 'function') {
          cb();
        }
      }, 'storage');

      storage(function (sjs) {
        _local = sjs;
        latch.countDown();
      }, 'LocalStorage');

      storage(function (sjs) {
        _session = sjs;
        latch.countDown();
      }, 'SessionStorage');

      storage(function (sjs) {
        _persistent = sjs;
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
    persistentStore: function () {
      return _persistent;
    }
  };
};