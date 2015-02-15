/*global global:true, require:true, console:true, Arenite:true, module:true*/
var fs = require('fs');
require('build/arenite.js');

global.window = {
  XMLHttpRequest: function(){
    return {
      setRequestHeader:function(){},
      open:function(m, url){
        var _this=this;
        fs.readFile(url, 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          _this.responseText = data;
          _this.onreadystatechange();
        });
      },
      send:function(){

      },
      readyState:4,
      status:200
    };
  },
  location: {hostname: '', search: ''},
  console: {
    log: console.log,
    groupCollapsed: console.log,
    groupEnd: function () {

    },
    trace: function () {

    }
  }
};

global.document = {
  createElement: function () {
    return {
      href: '',
      hostname: ''
    };
  }
};

module.exports = function (config, cb) {
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