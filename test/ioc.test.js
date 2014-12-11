/*global IOC:true, jasmine:true, blanket:true */
/*jshint evil:true*/
IOC.Test = function (ioc) {

  var _coverageLoad = function (url, cb) {
    ioc.loader.loadResource(url, function (resp) {
      window.blanket.instrument({inputFile: resp.responseText, inputFileName: url}, function (instrumented) {
        window.console.log('Instrumenting:', url);
        //inject the script with the instrumented version
        var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js\n//# sourceURL=' + window.location.origin + '/' + url + '_blanket_enhanced.js';
        eval(instrumented + file_tag);
        if (typeof cb === 'function') {
          cb();
        }
      });
    });
  };

  var _reloadWithCoverage = function (syncResources, asyncResources, cb) {
    var latch = ioc.async.latch(asyncResources.length, cb, 'async test dependencies retrieve');

    var seqLatch = ioc.async.seqLatch(syncResources, function (url) {
      _coverageLoad(url, seqLatch.next);
    }, function () {
      asyncResources.forEach(function (url) {
        _coverageLoad(url, latch.countDown);
      });
    }, 'sync test dependencies retrieve');
    seqLatch.next();
  };

  var _run = function (syncResources, asyncResources, testFiles) {
    var latch = ioc.async.latch(testFiles.length, function () {
      try {
        window.console.log('IOC: Starting the tests');
        var env = jasmine.getEnv();
        blanket.setupCoverage();
        env.addReporter(new jasmine.BlanketReporter());
        env.execute();
      }
      catch (e) {
        window.console.error(e.stack);
      }
    }, 'test definitions retrieve');

    _reloadWithCoverage(syncResources, asyncResources, function () {
      testFiles.forEach(function (testFile) {
        ioc.loader.loadScript(testFile, latch.countDown);
      });
    });
  };

  return {
    runTests: _run
  };
};