/*global IOC:true*/
IOC.Extensions = function () {
  return {
    context: {
      dependencies: {
        default: {
          async: [
            'js/extensions/bus/bus.js',
            'js/extensions/template/dot.js',
            'js/extensions/storage/storage.js'
          ]
        }
      },
      start: [
        {
          instance: 'bus',
          func: 'bus.publish',
          args: [{'value': 'hell-yeah'}]
        }
      ],
      instances: {
        bus: {
          extension: true,
          namespace: 'IOC.Bus'
        },
        templates: {
          namespace: 'IOC.Templates',
          args: [{ref: 'ioc'}]
        },
        storage: {
          namespace: 'IOC.Storage',
          args: [
            {ref: 'ioc'}
          ],
          init: {
            func: 'init',
            args: [{
              func: function () {
                window.console.log('db initialized');
              }
            }]
          }
        }
      }
    }
  };
};