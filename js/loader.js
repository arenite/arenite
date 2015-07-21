/*global Arenite:true*/
/*jshint evil:true*/
// Collection of utility functions to handle loading resources.
Arenite.Loader = function (arenite) {

  var firefoxOs = navigator.userAgent.indexOf('Firefox') > -1 && navigator.userAgent.indexOf("Mobile") > -1;

  var _createCORSRequest = function (method, url, success, failure) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Access-Control-Allow-Origin", window.location.origin);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status % 100 < 4) {
          success();
        } else {
          failure();
        }
      }
    };
    if (arenite.config.withCredentials) {
      if ('withCredentials' in xhr) {
        xhr.withCredentials = true;
      } else if (typeof XDomainRequest !== 'undefined') {
        xhr = new XDomainRequest();
        xhr.open(method, url);
        xhr.onload = success;
        xhr.onerror = failure;
      } else {
        xhr = null;
      }
    }
    return xhr;
  };

  var _loadResource = function (url, callback, error) {
    var req = _createCORSRequest('GET', url, function () {
      callback(req);
    }, function () {
      if (typeof error === 'function') {
        error(req);
      }
    });
    req.send();
  };

  var _loadScriptWithTag = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    if (navigator.appVersion.indexOf("MSIE 9") === -1) { //IE 9 calls the callback twice
      script.onreadystatechange = function () {
        if (this.readyState === 'complete') {
          callback();
        }
      };
    }
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
    if (_sameOrigin(url) && !firefoxOs) {
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
          if (typeof script.init === 'function') {
            script.init(arenite);
          }
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
