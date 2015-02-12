/*global Arenite:true*/
Arenite.Demo = function () {
  return {
    imports: [
      {
        url: 'demo/demo.sub.js',
        namespace: 'Arenite.SubDemo'
      }
    ],
    context: {
      dependencies: {
        default: {
          async: [
            'demo/annotation/annotation.js',
            'demo/echo/echo.js',
            'demo/config/config.js'
          ]
        }
      },
      start: [
        {
          func: function (arenite) {
            arenite.context.get('echo');
            window.setTimeout(function () {
              arenite.context.get('echo');
            }, 2000);
          },
          args: [
            {ref: 'arenite'}
          ]
        }
      ],
      instances: {
        initEcho: {
          namespace: 'Arenite.Echo',
          args: [{value: 'creation'}],
          init: 'init'
        },
        anonymousArgEcho: {
          namespace: 'Arenite.Echo',
          args: [{
            instance: {
              namespace: 'Arenite.Config',
              args: [{ref: 'arenite'}],
              init: 'get'
            }
          }]
        },
        echo: {
          factory: true,
          namespace: 'Arenite.Echo',
          args: [{
            exec: function () {
              return new Date();
            }
          }]
        },
        config: {
          namespace: 'Arenite.Config',
          args: [{ref: 'arenite'}]
        }
      }
    }
  };
};