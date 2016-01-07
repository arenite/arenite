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
        _this.responseText = '{"context":{"dependencies":{}}}';
        window.setTimeout(function () {
          _this.onreadystatechange();
        }, 1);
        return;
      }
      fs.readFile(_options.base + url.replace(/\?.*$/, ''), 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
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

  var arenite = Arenite.Object(arenite);
  arenite.forEach(arenite.object, function (func, name) {
    if (!Object.prototype[name]) {
      Object.prototype[name] = func;
    }
  });
  arenite.array.forEach(function (func, name) {
    if (!Array.prototype[name]) {
      Array.prototype[name] = func;
    }
  });
  _options = arenite.extend({env: 'dev', base: ''}, options);
  arenite = arenite.extend(arenite, new Arenite.Async(arenite));
  arenite = arenite.extend(arenite, new Arenite.Url(arenite));
  arenite = arenite.extend(arenite, new Arenite.DI(arenite));
  arenite = arenite.extend(arenite, new Arenite.AnnotationProcessor(arenite));
  arenite = arenite.extend(arenite, new Arenite.Context(arenite));
  arenite = arenite.extend(arenite, new Arenite.Loader(arenite));
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
        script = script.indexOf("//") === 0 ? 'http:' + script : options.base + script;
        script = script.replace(/\?.*$/, '');
        var match = regex.exec(script);
        if (match) {
          if (!merged) {
            merged = remoteSrc(script);
          } else {
            merged = gulpMerge(merged, remoteSrc(script));
          }
        } else {
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