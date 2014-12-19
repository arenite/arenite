/*global IOC:true*/
/*jshint evil:true*/
IOC.Loader = function (ioc) {

  var _loadResource = function (url, callback, error) {
    var req = new window.XMLHttpRequest();
    req.open('GET', url);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status % 100 < 4) {
          callback(req);
        } else if (typeof error === 'function') {
          error(req);
        }
      }
    };
    req.send();
  };

  var _loadScript = function (url, callback) {
    _loadResource(url, function (req) {
      //analyze the script for "annotation" type configurations
      ioc.di.processAnnotations(req.responseText);
      var file_tag = '\n//@ sourceURL=' + window.location.origin + '/' + url + '\n//# sourceURL=' + window.location.origin + '/' + url;
      eval(req.responseText + file_tag);
      callback();
    });
  };

  return {
    loader: {
      loadResource: _loadResource,
      loadScript: _loadScript
    }
  };
};