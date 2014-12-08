/* globals jasmine:true, blanket:true */
jasmine.BlanketReporter = function () {

  var onStart = function () {
    blanket.onTestStart();
  };

  var onTestDone = function () {
  };

  var onTestsFinished = function () {
    blanket.onTestsDone();
  };

  return {
    jasmineStarted: onStart,
    specDone: onTestDone,
    jasmineDone: onTestsFinished
  };
};