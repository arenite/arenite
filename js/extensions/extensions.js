/*global IOC:true*/
// This is a sample configuration that adds the existing extensions to the sandbox.
// The sandbox object is auto-registered as <code>ioc</code> and can be referenced for any other instance.
IOC.Extensions = function () {
  return {
    context: {
      dependencies: {
        default: {
          async: [
            //'lib/jquery-2.1.1.min.js',
            '//code.jquery.com/jquery-2.1.3.min.js',
            'lib/doT.min.js',
            'lib/storage.min.js',
            '/di/js/extensions/bus/bus.js',
            '/di/js/extensions/template/dot.js',
            '/di/js/extensions/storage/storage.js'
          ]
        }
      },
      start: [
        {
          instance: 'ioc',
          func: 'bus.publish',
          args: [{'value': 'application-started'}]
        }
      ],
      extensions: {
        //### IOC.Bus
        // Event bus extension.
        //
        // Described in <a href="extensions/bus/bus.html">IOC.Bus</a>.
        bus: {
          namespace: 'IOC.Bus'
        },
        //### IOC.Templates
        // HTML templating extension using <a href="http://olado.github.io/doT/index.html">doT.js</a>.
        //
        // Described in <a href="extensions/template/dot.html">IOC.Templates</a>
        templates: {
          namespace: 'IOC.Templates',
          args: [{ref: 'ioc'}],
          init: {
            wait: true,
            func: 'add',
            args: [{
              value: ['templates/templates.html']
            }]
          }
        },
        //### IOC.Storage
        // Local storage extension using <a href="https://github.com/lcavadas/Storage.js">Storage.js</a>
        //
        // Described in <a href="extensions/storage/storage.html">IOC.Storage</a>
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