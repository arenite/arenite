/* global IOC:true, doT:true */
IOC.Templates = function (ioc) {
  var _templates = {};

  return {
    template: {
      add: function (urls, callback) {
        urls.forEach(function (url) {
          ioc.loader.loadResource(url, function (template) {
            var templateContainer = document.createElement('div');
            templateContainer.innerHTML = template.responseText;
            document.body.appendChild(templateContainer);

            var scriptTags = templateContainer.getElementsByTagName('script');
            for (var i = 0; i < scriptTags.length; i++) {
              _templates[scriptTags[i].id] = doT.template(scriptTags[i].innerHTML);
            }

            if (typeof callback === 'function') {
              callback();
            }

            document.body.removeChild(templateContainer);
          });
        });
      },
      apply: function (name, arg) {
        return _templates[name](arg);
      }
    }
  };
};