/*global IOC:true, jasmine:true, blanket:true */
/*jshint evil:true*/
IOC.Test = function (ioc) {

  var _reloadWithCoverage = function (resources) {
    resources.forEach(function (url) {
      ioc.loadResource(url, function (resp) {
        window.blanket.instrument({inputFile: resp.responseText, inputFileName: url}, function (instrumented) {
          //inject the script with the instrumented version
          var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js\n//# sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js';
          eval(instrumented + file_tag);
        });
      });
    });
  };

  var _run = function () {
    try {
      var env = jasmine.getEnv();
      blanket.setupCoverage();
      env.addReporter(new jasmine.BlanketReporter());
      env.execute();
    }
    catch (e) {
      window.console.error(e.stack);
    }
  };

  return {
    enableCoverage: _reloadWithCoverage,
    runTests: _run
  };
};