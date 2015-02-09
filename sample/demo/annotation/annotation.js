/*global IOC:true*/
/*
 @ioc-instance 'annotated1' ref:ioc;
 @ioc-init 'init' value : "init annotated1";
 @ioc-start 'start' value : "start", value : "annotated1";
 */

IOC.Annotated1 = function (ioc) {
  window.console.log('instantiation', 'annotated1', ioc);

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
 @ioc-instance 'annotated2' ref:ioc;
 @ioc-init 'init' value : "init annotated2";
 */

IOC.Annotated2 = function (ioc) {
  window.console.log('instantiation', 'annotated2', ioc);

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
 @ioc-instance 'annotated3' ref:ioc;
 @ioc-start 'start'  value : "start", value : "annotated3";
 */

IOC.Annotated3 = function (ioc) {
  window.console.log('instantiation', 'annotated3', ioc);

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
 @ioc-instance 'annotated4' ref:ioc;
 */

IOC.Annotated4 = function (ioc) {
  window.console.log('instantiation', 'annotated4', ioc);
};