/*global Arenite:true*/
Arenite.Bus = function () {
  var bus = {};

  var _subscribe = function (subject, func) {
    if (!bus[subject]) {
      bus[subject] = [];
    }
    bus[subject].push(func);
  };

  var _unsubscribe = function (subject, func) {
    if (bus[subject]) {
      bus[subject].forEach(function (handler, idx) {
        if (handler === func) {
          bus[subject].splice(idx, 1);
        }
      });
    }
  };

  var _publish = function (subject, args) {
    window.console.groupCollapsed("sending event:\"" + subject + "\" with ", args);
    window.console.trace();
    window.console.groupEnd();
    if (bus[subject]) {
      bus[subject].forEach(function (handler) {
        window.setTimeout(function () { //make the calls asynchronous
          handler(args);
        }, 0);
      });
    }
  };

  return {
    bus: {
      subscribe: _subscribe,
      unsubscribe: _unsubscribe,
      publish: _publish
    }
  };
};