/*global global:true, require:true, console:true, Arenite:true, module:true*/
var fs = require('fs');
var gulp = require('gulp');
var remoteSrc = require('gulp-download');
var gulpMerge = require('gulp-merge');
require('./build/arenite.js');

global.window = global;

global.window.XMLHttpRequest = function () {
  return {
    setRequestHeader: function () {
    },
    open: function (m, url) {
      var _this = this;
      fs.readFile(url, 'utf8', function (err, data) {
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

var Loader = function (config, cb) {
  var arenite = Arenite.Object(arenite);
  arenite = arenite.object.extend(arenite, new Arenite.Async());
  arenite = arenite.object.extend(arenite, new Arenite.Url());
  arenite = arenite.object.extend(arenite, new Arenite.DI(arenite));
  arenite = arenite.object.extend(arenite, new Arenite.AnnotationProcessor(arenite));
  arenite = arenite.object.extend(arenite, new Arenite.Context(arenite));
  arenite = arenite.object.extend(arenite, new Arenite.Loader(arenite));
  arenite.di.loadConfig(config, function () {
    cb(arenite.config);
  });
};

module.exports = function (mode, config, cb) {
  Loader(config, function (config) {
    var local = [];
    var remote = [];

    var _parse = function (urls) {
      urls.forEach(function (script) {
        var regex = /http[s]*:\/\/.*?\/.*/;
        if (typeof script === 'object') {
          script = script.url;
        }
        script = script.indexOf("//") === 0 ? 'http:' + script : script;
        var match = regex.exec(script);
        if (match) {
          remote.push(match[0]);
        } else {
          local.push(script);
        }
      });
    };

    if (config.imports) {
      _parse(config.imports);
    }
    if (config.context.dependencies[mode].sync) {
      _parse(config.context.dependencies[mode].sync);
    }
    if (config.context.dependencies[mode].async) {
      _parse(config.context.dependencies[mode].async);
    }

    cb(gulpMerge(remoteSrc(remote), gulp.src(local)));
  });
};