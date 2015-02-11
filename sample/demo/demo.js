/*global Arenite:true*/
Arenite.Demo = function () {
  return {
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
            arenite.di.getInstance('echo');
            window.setTimeout(function () {
              arenite.di.getInstance('echo');
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
              args: [{ref: 'arenite'}]
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