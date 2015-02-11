/*global Arenite:true, jasmine:true, blanket:true */
/*jshint evil:true*/
Arenite.Test = function (arenite) {

  var _coverageLoad = function (url, cb) {
    arenite.loader.loadResource(url, function (resp) {
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
    var latch = arenite.async.latch(asyncResources.length, cb, 'async test dependencies retrieve');

    var seqLatch = arenite.async.seqLatch(syncResources, function (url) {
      _coverageLoad(url, seqLatch.next);
    }, function () {
      asyncResources.forEach(function (url) {
        _coverageLoad(url, latch.countDown);
      });
    }, 'sync test dependencies retrieve');
    seqLatch.next();
  };

  var _run = function (syncResources, asyncResources, testFiles) {
    var latch = arenite.async.latch(testFiles.length, function () {
      try {
        window.console.log('Arenite: Starting the tests');
        var env = jasmine.getEnv();
        blanket.setupCoverage();

        jasmineRequire.console(jasmineRequire, jasmine);
        var consoleReporter = new jasmine.ConsoleReporter({print: function (t) {
          if (t !== '.' && t.trim().length > 0) {
            window.console.log(t);
          }
        }});

        env.addReporter(new jasmine.BlanketReporter());
        env.addReporter(consoleReporter);
        env.execute();
      }
      catch (e) {
        window.console.error(e.stack);
      }
    }, 'test definitions retrieve');

    _reloadWithCoverage(syncResources, asyncResources, function () {
      testFiles.forEach(function (testFile) {
        arenite.loader.loadScript(testFile, latch.countDown);
      });
    });
  };

  return {
    runTests: _run
  };
};