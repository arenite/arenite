/*global global:true, require:true, Arenite:true, module:true*/
require('./build/arenite.js');

global.navigator = {userAgent: 'node'};

global.window = global;

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