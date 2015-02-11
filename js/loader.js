/*global Arenite:true*/
/*jshint evil:true*/
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
      arenite.di.processAnnotations(req.responseText);
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

  var _loadScript = function (url, callback) {
    if (_sameOrigin(url)) {
      _loadScriptAsResource(url, callback);
    } else {
      _loadScriptWithTag(url, callback);
    }
  };

  return {
    loader: {
      loadResource: _loadResource,
      loadScript: _loadScript
    }
  };
};