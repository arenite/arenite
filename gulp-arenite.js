/*global global:true, require:true, console:true, Arenite:true, module:true*/
var fs = require('fs');
var gulp = require('gulp');
var remoteSrc = require('gulp-download');
var gulpMerge = require('gulp-merge');
require('./build/arenite.js');

var _options;

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
          data='{"context":{"dependencies":{"default":{},"dev":{}}}}';
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

var Loader = function (config, options, cb) {
  if (options.base.length && options.base[options.base.length - 1] !== '/') {
    options.base = options.base + '/';
  }

  config.mode = options.mode;

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
  _options = ({env: 'dev', base: ''}).fuseWith(options);
  arenite.fuseWith(new Arenite.Async(arenite));
  arenite.fuseWith(new Arenite.Url(arenite));
  arenite.fuseWith(new Arenite.DI(arenite));
  arenite.fuseWith(new Arenite.AnnotationProcessor(arenite));
  arenite.fuseWith(new Arenite.Context(arenite));
  arenite.fuseWith(new Arenite.Loader(arenite));
  arenite.di.loadConfig(config, function () {
    cb(arenite, arenite.config);
  });
};

module.exports = function (options, config, cb) {
  Loader(config, options, function (arenite, config) {
    var merged;

    var _parse = function (urls) {
      urls.forEach(function (script) {
        if (typeof script === 'object') {
          script = script.url;
        }
        if (script.match(/.*\.(\w+)\?*.*/)[1] !== 'js') {
          return;
        }
        var regex = /http[s]*:\/\/.*?\/.*/;
        script = script.indexOf("//") === 0 ? 'http:' + script : script;
        script = script.replace(/\?.*$/, '');
        var match = regex.exec(script);
        if (match) {
          if (!merged) {
            merged = remoteSrc(script);
          } else {
            merged = gulpMerge(merged, remoteSrc(script));
          }
        } else {
          script = options.base + script
          if (!merged) {
            merged = gulp.src(script);
          } else {
            merged = gulpMerge(merged, gulp.src(script));
          }
        }
      });
    };

    if (config.context.dependencies[options.mode].sync) {
      _parse(config.context.dependencies[options.mode].sync);
    }
    if (config.context.dependencies[options.mode].async) {
      _parse(config.context.dependencies[options.mode].async);
    }

    cb(merged);
  });
};