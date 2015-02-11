/* global IOC:true, doT:true */
IOC.Templates = function (ioc) {
  var _templates = {};

  var _add = function (urls, callback) {
    urls.forEach(function (url) {
      ioc.loader.loadResource(url, function (template) {
        var templateContainer = document.createElement('div');
        templateContainer.innerHTML = template.responseText;
        document.body.appendChild(templateContainer);

        var scriptTags = templateContainer.getElementsByTagName('script');
        for (var i = 0; i < scriptTags.length; i++) {
          _templates[scriptTags[i].id] = doT.template(scriptTags[i].innerHTML);
        }

        document.body.removeChild(templateContainer);
      });
    });
    if (typeof callback === 'function') {
      callback();
    }
  };

  var _apply = function (name, arg) {
    if (!_templates[name]) {
      throw "Unable to find template '" + name + "'";
    }
    return _templates[name](arg);
  };

  return {
    add: _add,
    apply: _apply
  };
};