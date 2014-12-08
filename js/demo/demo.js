/*global IOC:true*/
IOC.Demo = function () {
  return {
    context: {
      dependencies: {
        default: {
          async: [
            'js/demo/echo/echo.js',
            'js/demo/config/config.js'
          ]
        }
      },
      start: [
        {
          func: function (ioc) {
            ioc.di.getInstance('echo');
            window.setTimeout(function () {
              ioc.di.getInstance('echo');
            }, 2000);
          },
          args: [
            {ref: 'ioc'}
          ]
        }
      ],
      instances: {
        echo: {
          factory: true,
          namespace: 'IOC.Echo',
          args: [{
            exec: function () {
              return new Date();
            }
          }]
        },
        config: {
          namespace: 'IOC.Config',
          args: [{ref: 'ioc'}]
        }
      }
    }
  };
};