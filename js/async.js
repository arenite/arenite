/*global Arenite:true*/
//Asynchronous tools
Arenite.Async = function (arenite) {
  var _sequencialLatch = function (values, callback, finalCallback) {
    var index = 0;
    var length = values.length;

    var _next = function () {
      if (index < length) {
        callback(values[index++]);
      } else {
        finalCallback();
      }
    };

    return {
      next: _next
    };
  };

  var _latch = function (times, callback, name) {
    var executions = 0;
    var id = name || new Date().getTime();

    if (arenite.config.debug) {
      window.console.groupCollapsed('Latch: Starting latch "' + id + '" for', times, 'times');
      window.console.trace();
      window.console.groupEnd();
    }

    return {
      countDown: function () {
        executions++;
        if (arenite.config.debug) {
          window.console.log('Latch: Counting down latch "' + id + '" ,', times - executions, 'remaining');
        }
        if (executions === times) {
          if (arenite.config.debug) {
            window.console.log('Latch: Triggering latch "' + id + '"');
          }
          callback(executions);
        }
      },
      countUp: function () {
        executions--;
        if (arenite.config.debug) {
          window.console.log('Latch: Counting up latch "' + id + '" ,', times - executions, 'remaining');
        }
        if (executions === times) {
          if (arenite.config.debug) {
            window.console.log('Latch: Triggering latch "' + id + '"');
          }
          callback(executions);
        }
      }
    };
  };

  var _webworker = function () {
    var self = this;
    var window = self;
    self.arenite = {};
    self.onmessage = function (e) {
      /* jshint evil:true */
      e.data.arenite.forEach(function (dep) {
        arenite = eval('(' + dep.code + ')();');
      });
      e.data.deps.forEach(function (dep) {
        if (dep.type === 'raw') {
          arenite.object.set(self, dep.name, eval('(function(){ return ' + dep.code + ';})();'));
        } else {
          arenite.object.set(self, dep.name, eval('(' + dep.code + ')();'));
        }
      });
      var result = self.__MAIN__.apply(this, e.data.args);
      self.postMessage(result);
    };
  };

  var _serialize = function (func, strip) {
    var script = func.toString();
    if (strip) {
      script = script.slice(script.indexOf("{") + 1, script.lastIndexOf("}"));
    }
    return script;
  };

  var _createWebWorker = function (func, deps, cb, keepAlive) {
    var _cb = cb;
    var worker = new Worker(URL.createObjectURL(new Blob([_serialize(_webworker, true)])));
    worker.onmessage = function (e) {
      _cb(e.data);
      if (!keepAlive) {
        worker.terminate();
      }
    };
    var serializedDeps = [];
    (deps || []).forEach(function (dep) {
      serializedDeps.push({name: dep.name, code: _serialize(dep.func), type: dep.type});
    });
    serializedDeps.push({name: '__MAIN__', code: _serialize(func), type: 'raw'});

    var api = {
      exec: function (args, cb) {
        if (cb) {
          _cb = cb;
        }
        worker.postMessage({
          args: args,
          deps: serializedDeps,
          arenite: [{name: 'object', code: _serialize(Arenite.Object)}]
        });
        return api;
      },
      kill: function () {
        if (keepAlive) {
          worker.terminate();
        }
      }
    };
    return api;
  };

  return {
    async: {
      //###Sequencial latch.
      //The sequencial latch will synchronously execute the handler
      // with the provided values and execute a callback when all operations are complete.
      //<pre><code>
      // seqLatch(values, handler, callback)
      //</code></pre>
      // Where *<b>values</b>* is an array of values to be passed as parameters to the handler function.
      // The *<b>handler</b>* function must call the <code>next</code> function of the returned object when it
      // finishes the execution.
      // The *<b>callback</b>* is the function that is executed once all the values have been handled.
      seqLatch: _sequencialLatch,
      //###Latch.
      //The latch will execute asynchronous tasks and invoke a callback when all the declared times have been executed
      //<pre><code>
      // latch(times, callback [, name])
      //</code></pre>
      // Where *<b>times</b>* is the initially expected times the latch should wait for to trigger the callback.
      // The *<b>callback</b>* is the function invoked once times reaches 0.
      // The optional *<b></b>*name is if you wish to have a meaningful name in the console logs.
      // This function returns an object with two functions:
      //<pre><code>
      // {
      //   countDown:...
      //   countUp:...
      // }
      //</code></pre>
      // *<b>countDown</b>* will decrease the counter and *<b>CountUp</b>* will increase the counter that is initialized with the times argument.
      // Once the counter hits 0 the callback is invoked.
      latch: _latch,
      webworker: _createWebWorker
    }
  };
}
;
