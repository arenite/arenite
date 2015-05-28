/* global Arenite:true */
Arenite.Templates = function (arenite, doT) {
  var _templates = {};

  var _addText = function (text) {
    var templateContainer = document.createElement('div');
    templateContainer.innerHTML = text;
    document.body.appendChild(templateContainer);

    var scriptTags = templateContainer.getElementsByTagName('script');
    for (var i = 0; i < scriptTags.length; i++) {
      _templates[scriptTags[i].id] = doT.template(scriptTags[i].innerHTML);
    }
    document.body.removeChild(templateContainer);
  };

  var _add = function (urls, callback) {
    var templateLatch = arenite.async.latch(urls.length, function () {
      if (typeof callback === 'function') {
        callback();
      }
    }, "template loader");
    urls.forEach(function (url) {
      arenite.loader.loadResource(url, function (template) {
        _addText(template.responseText);
        templateLatch.countDown();
      });
    });
  };

  var _apply = function (name, arg) {
    if (!_templates[name]) {
      throw "Unable to find template '" + name + "'";
    }
    return _templates[name](arg);
  };

  return {
    add: _add,
    addText: _addText,
    apply: _apply
  };
};