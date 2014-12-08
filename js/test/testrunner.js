/*global IOC:true, jasmine:true, blanket:true */
/*jshint evil:true*/
IOC.Test = function (ioc) {

  var _reloadWithCoverage = function () {
    var url = 'js/ioc.js';
    ioc.loadResource(url, function (resp) {
      window.blanket.instrument({inputFile: resp.responseText, inputFileName: url}, function (instrumented) {
        //re-inject the script with the instrumented version
        var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js\n//# sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js';
        eval(instrumented + file_tag);
        if (!window.instrumented) {
          //document.body.innerHTML='';
          IOC(ioc.config);
        }
      });
    });
  };

  var _run = function () {
    if (!window.instrumented) {
      window.instrumented = true;
      return;
    }
    var env = jasmine.getEnv();
    blanket.setupCoverage();
    env.addReporter(new jasmine.BlanketReporter());
    env.execute();
  };

  return {
    enableCoverage: _reloadWithCoverage,
    runTests: _run
  };
};