/*global IOC:true*/
IOC.Loader = function () {
  var _loadScript = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = script.onload = function () {
      window.console.log('IOC: Loaded', url);
      if (typeof callback === 'function') {
        callback();
      }
    };
    window.console.log('IOC: Loading', url);
    head.appendChild(script);
  };

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

  return {
    loader: {
      loadResource: _loadResource,
      loadScript: _loadScript
    }
  };
};