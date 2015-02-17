/*global Arenite:true*/
// This is a sample configuration that adds the existing extensions to the sandbox.
// The sandbox object is auto-registered as <code>arenite</code> and can be referenced for any other instance.
Arenite.Extensions = function () {
  return {
    context: {
      dependencies: {
        default: {
          sync: [
            {
              url: '//code.jquery.com/jquery-2.1.3.min.js',
              instances: {
                jquery: '$'
              }
            }
          ],
          async: [
            {
              url: 'lib/doT.min.js',
              instances: {
                doT: 'doT'
              }
            },
            {
              url: 'lib/storage.min.js',
              instances: {
                storagejs: 'storage'
              }
            },
            '/arenite/js/extensions/bus/bus.js',
            '/arenite/js/extensions/template/dot.js',
            '/arenite/js/extensions/storage/storage.js',
            '/arenite/js/extensions/router/router.js'
          ]
        }
      },
      start: [
        {
          instance: 'arenite',
          func: 'bus.publish',
          args: [{'value': 'application-started'}]
        }
      ],
      extensions: {
        //### Arenite.Bus
        // Event bus extension.
        //
        // Described in <a href="extensions/bus/bus.html">Arenite.Bus</a>.
        bus: {
          namespace: 'Arenite.Bus'
        },
        //### Arenite.Templates
        // HTML templating extension using <a href="http://olado.github.io/doT/index.html">doT.js</a>.
        //
        // Described in <a href="extensions/template/dot.html">Arenite.Templates</a>
        templates: {
          namespace: 'Arenite.Templates',
          args: [
            {ref: 'arenite'},
            {ref: 'doT'}
          ],
          init: {
            wait: true,
            func: 'add',
            args: [{
              value: ['templates/templates.html']
            }]
          }
        },
        //### Arenite.Storage
        // Local storage extension using <a href="https://github.com/lcavadas/Storage.js">Storage.js</a>
        //
        // Described in <a href="extensions/storage/storage.html">Arenite.Storage</a>
        storage: {
          namespace: 'Arenite.Storage',
          args: [
            {ref: 'arenite'},
            {ref: 'storagejs'}
          ],
          init: {
            func: 'init',
            args: [{
              func: function () {
                window.console.log('db initialized');
              }
            }]
          }
        },
        router: {
          namespace: 'Arenite.Router',
          args: [{ref: 'arenite'}],
          init: {
            func: 'init',
            args: [{
              value: {
                '/a/b/c': [{
                  instance: 'echo',
                  func: 'echo',
                  args: [{value: 'routearg'}]
                }],
                '/:c/:a/:d': [{
                  instance: 'echo',
                  func: 'echo'
                }],
                '/1/:a/2': [{
                  instance: 'echo',
                  func: 'echo'
                }],
                '/1/:a/:b': [{
                  instance: 'echo',
                  func: 'echo'
                }],
                '/abc/:c': [{
                  func: function () {
                    console.log('Router executing a function', arguments);
                  }
                }]
              }
            }]
          }
        }
      }
    }
  };
};