/*global global:true, require:true, module:true, console:true*/
var fs = require('fs');
var gulp = require('gulp');
var remoteSrc = require('gulp-download');
var gulpMerge = require('merge2');
var arenite = require('arenite');

var _options;
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
var Loader = function (config, options, cb) {
  if (options.base.length && options.base[options.base.length - 1] !== '/') {
    options.base = options.base + '/';
  }

  config.mode = options.mode;
  _options = ({env: 'dev', base: ''}).fuseWith(options);
  arenite.di.loadConfig(config, function () {
    cb(arenite, arenite.config);
  });
};
module.exports = function (options, config, cb) {
  Loader(config, options, function (arenite, config) {
    var merged = gulpMerge();

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
          merged.add(remoteSrc(script));
        } else {
          merged.add(gulp.src(options.base + script));
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