/*global Arenite:true*/
/*jshint evil:true*/
// Collection of utility functions to handle loading resources.
Arenite.Loader = function (arenite) {

  var _loadResource = function (url, callback, error) {
    var req = new window.XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status % 100 < 4) {
          callback(req);
        } else if (typeof error === 'function') {
          error(req);
        }
      }
    };
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.setRequestHeader("Access-Control-Allow-Origin", window.location.origin);
    req.send();
  };

  var _loadScriptWithTag = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.onreadystatechange = function () {
      if (this.readyState === 'complete') {
        callback();
      }
    };
    script.onload = callback;
    script.src = url;
    head.appendChild(script);
  };

  var _loadScriptAsResource = function (url, callback) {
    _loadResource(url, function (req) {
      //analyze the script for "annotation" type configurations
      arenite.annotation.processAnnotations(req.responseText);
      var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '\n//# sourceURL=' + window.location.origin + '/' + url;
      eval(req.responseText + file_tag);
      callback();
    });
  };

  var _sameOrigin = function (url) {
    var loc = window.location;
    var a = document.createElement('a');
    a.href = url;
    return a.hostname === loc.hostname &&
      a.port === loc.port &&
      a.protocol === loc.protocol;
  };

  var _loadScriptFrom = function (url, callback) {
    if (_sameOrigin(url)) {
      _loadScriptAsResource(url, callback);
    } else {
      _loadScriptWithTag(url, callback);
    }
  };

  var _loadScript = function (script, done) {
    if (typeof script === 'string') {
      _loadScriptFrom(script, done);
    } else {
      _loadScriptFrom(script.url, function () {
        arenite.object.keys(script.instances).forEach(function (instance) {
          arenite.context.add(instance, window[script.instances[instance]]);
          delete window[script.instances[instance]];
        });
        if (typeof done === 'function') {
          done();
        }
      });
    }
  };

  return {
    loader: {
      //###loader.loadResource
      // Load a given resource using ajax.
      //<pre><code>
      // loadResource(url, callback, error)
      //</pre></code>
      //where *<b>url</b>* is the url to fetch from,  *<b>callback</b>* is a function called with the ajax request after
      // it's succesful completion and *<b>error</b>* is an optional callback to handle errors when fetching the resource
      loadResource: _loadResource,
      //###loader.loadScript
      // Load a script. This method will choose the best method to load the script (using tag or ajax) depending on the
      // origin of the script. Additionally it can extract variables exposed in the window object and register them as
      // instances in arenite.
      //<pre><code>
      // loadScript(script, callback)
      //</pre></code>
      //where *<b>script</b>* is either a url string or a structure defining a url and instances to be extracted from
      // the window object into arenite and *<b>callback</b>* is the callback for when the script is loaded.
      loadScript: _loadScript
    }
  };
};