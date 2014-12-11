/* global IOC:true, doT:true */
IOC.Templates = function (ioc) {
  var _templates = {};

  return {
    template: {
      add: function (url, callback) {
        ioc.loader.loadResource(url, function (template) {

          var _$templateContainer = $('<div></div>');
          $(document.body).append(_$templateContainer);

          _$templateContainer.html(template);
          _$templateContainer.find('script[type="text/x-dot-template"]').each(function (idx, template) {
            _templates[template.id] = doT.template($(template).html());
          });

          if (typeof callback === 'function') {
            callback();
          }

          _$templateContainer.remove();
        });
      },
      apply: function (name, arg) {
        return _templates[name](arg);
      }
    }
  };
};