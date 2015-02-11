/*global Arenite:true*/
/*
 @arenite-instance 'annotated1' ref:arenite;
 @arenite-init 'init' value : "init annotated1";
 @arenite-start 'start' value : "start", value : "annotated1";
 */

Arenite.Annotated1 = function (arenite) {
  window.console.log('instantiation', 'annotated1', arenite);

  var _start = function () {
    window.console.log(arguments);
  };

  var _init = function () {
    window.console.log(arguments);
  };

  return {
    init: _init,
    start: _start
  };
};

/*
 @arenite-instance 'annotated2' ref:arenite;
 @arenite-init 'init' value : "init annotated2";
 */

Arenite.Annotated2 = function (arenite) {
  window.console.log('instantiation', 'annotated2', arenite);

  var _start = function () {
    window.console.log(arguments);
  };

  var _init = function () {
    window.console.log(arguments);
  };

  return {
    init: _init,
    start: _start
  };
};

/*
 @arenite-instance 'annotated3' ref:arenite;
 @arenite-start 'start'  value : "start", value : "annotated3";
 */

Arenite.Annotated3 = function (arenite) {
  window.console.log('instantiation', 'annotated3', arenite);

  var _start = function () {
    window.console.log(arguments);
  };

  var _init = function () {
    window.console.log(arguments);
  };

  return {
    init: _init,
    start: _start
  };
};


/*
 @arenite-instance 'annotated4' ref:arenite;
 */

Arenite.Annotated4 = function (arenite) {
  window.console.log('instantiation', 'annotated4', arenite);
};