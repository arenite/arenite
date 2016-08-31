/*global global:true, require:true, console:true, Arenite:true, module:true*/
var fs = require('fs');
require('./build/arenite.js');

global.navigator = {userAgent: 'node'};

global.window = global;

global.window.XMLHttpRequest = function () {
  return {
    setRequestHeader: function () {
    },
    open: function (m, url) {
      var _this = this;
      if (url.substr(0, 2) === '//' || url.substr(0, 4) === 'http') {
        _this.responseText = '{"context":{"dependencies":{"default":{},"dev":{}}}}';
        window.setTimeout(function () {
          _this.onreadystatechange();
        }, 1);
        return;
      }
      fs.readFile(_options.base + url.replace(/\?.*$/, ''), 'utf8', function (err, data) {
        if (err) {
          console.log(err);
          data = '{"context":{"dependencies":{"default":{},"dev":{}}}}';
        }
        _this.responseText = data;
        _this.onreadystatechange();
      });
    },
    send: function () {

    },
    readyState: 4,
    status: 200
  };
};

global.window.location = {hostname: '', search: ''};
global.window.console.groupCollapsed = global.console.log;
global.window.console.groupEnd = function () {

};
global.window.console.trace = function () {

};

global.document = {
  createElement: function () {
    return {
      href: '',
      hostname: ''
    };
  }
};

var arenite = Arenite.Object();
arenite.object.forEach(arenite.object, function (func, name) {
  if (!Object.prototype[name]) {
    Object.defineProperty(Object.prototype, name, {
      writable: true,
      enumerable: false,
      value: function () {
        return func.apply(this, [this].concat([].slice.call(arguments)));
      }
    });
  }
});
arenite.object.forEach(arenite.array, function (func, name) {
  if (!Array.prototype[name]) {
    Object.defineProperty(Array.prototype, name, {
      writable: true,
      enumerable: false,
      value: function () {
        return func.apply(this, [this].concat([].slice.call(arguments)));
      }
    });
  }
});
arenite.fuseWith(new Arenite.Async(arenite));
arenite.fuseWith(new Arenite.Url(arenite));
arenite.fuseWith(new Arenite.DI(arenite));
arenite.fuseWith(new Arenite.AnnotationProcessor(arenite));
arenite.fuseWith(new Arenite.Context(arenite));
arenite.fuseWith(new Arenite.Loader(arenite));

module.exports = arenite;