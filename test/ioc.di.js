/*global IOC:true, describe:true, it:true, expect:true, jasmine:true, spyOn:true */
describe("IOC.DI", function () {
  IOC.Extra = function () {

  };

  it("should be able to add and retrieve instances from the context", function () {
    var di = IOC.DI();
    var instance = (function () {
      return {'a': 'b'};
    })();
    di.di.addInstance('instanceName', instance, false);
    expect(di.di.getInstance('instanceName')).toBe(instance);
  });

  it("should be able to retrieve factory instances from the context", function () {
    var di = IOC.DI();
    var factory = function () {
      return {a: 'b'};
    };
    di.di.addInstance('instanceName', factory, true);
    expect(di.di.getInstance('instanceName')).toEqual(factory());
  });

  it("should be able to retrieve factory instances with arguments from the context", function () {
    var di = IOC.DI();
    var factory = function (c) {
      return {a: c};
    };
    di.di.addInstance('instanceName', factory, true, [{value: '1'}]);
    expect(di.di.getInstance('instanceName')).toEqual(factory('1'));
  });

  it("should be able to retrieve differnt instances from factory instances on each retrieve", function () {
    var di = IOC.DI();
    var factory = function (c) {
      return {a: c};
    };
    di.di.addInstance('instanceName', factory, true, [{
      exec: function () {
        return window.performance.now();
      }
    }]);
    expect(di.di.getInstance('instanceName')).not.toEqual(di.di.getInstance('instanceName'));
  });

  it("should return undefined for unknown instances", function () {
    var di = IOC.DI();
    expect(di.di.getInstance('instanceName')).toBe(undefined);
  });

  it("should throw exception if arguments can\'t be resolved", function () {
    var di = IOC.DI({
      di: {
        getInstance: function () {
          return null;
        }
      }
    });
    di.di.addInstance('instanceName', function (c) {
      return {a: c};
    }, true, [{ref: 'impossible'}]);
    expect(function () {
      di.di.getInstance('instanceName');
    }).toThrow('Unable to resolve arguments for "instanceName"');
  });

  it("should resolve value arguments", function () {

  });

  it("should resolve exec arguments", function () {
    var calls = 0;
    var di = IOC.DI();
    var factory = function (c) {
      return {a: c};
    };
    di.di.addInstance('instanceName', factory, true, [{
      exec: function () {
        calls++;
        return window.performance.now();
      }
    }]);
    di.di.getInstance('instanceName');
    expect(calls).toBe(1);
  });

  it("should resolve func arguments", function () {
    var func = function () {
    };
    var di = IOC.DI({
      di: {
        getInstance: function () {
          return {};
        }
      }
    });
    di.di.addInstance('instanceName', function (c) {
      return {a: c};
    }, true, [{func: func}]);
    expect(di.di.getInstance('instanceName').a).toBe(func);
  });

  it('can use empty config', function () {
    IOC({});
  });

  it('should not expose ioc if option isn\'t true', function () {
    IOC({
      exposeIoc: false
    });
    expect(window.ioc).toBe(undefined);
  });

  it('should expose ioc if option is true', function () {
    IOC({
      exposeIoc: true
    });
    expect(window.ioc).not.toBe(undefined);
  });

  it('should merge config with imports', function () {
    spyOn(IOC, 'Extra').and.callFake(function () {
      return {
        context: {
          instances: {}
        }
      };
    });
    IOC({
      exposeIoc: true,
      imports: [
        {
          url: 'url',
          namespace: 'IOC.Extra'
        }
      ]
    });

    expect(window.ioc.config).toEqual({
      exposeIoc: true, imports: [{url: 'url', namespace: 'IOC.Extra'}], mode: 'default', context: {instances: {}}
    });
  });

  it('should fetch and merge config with imports if not already present', function () {
    spyOn(IOC, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: function (url, cb) {
            IOC.Extra2 = function () {
              return {
                context: {
                  instances: {}
                }
              };
            };
            cb();
          }
        }
      };
    });

    IOC({
      exposeIoc: true,
      imports: [
        {
          url: 'url',
          namespace: 'IOC.Extra2'
        }
      ]
    });

    expect(window.ioc.config).toEqual({
      exposeIoc: true, imports: [{url: 'url', namespace: 'IOC.Extra2'}], mode: 'default', context: {instances: {}}
    });
  });

  it('should fetch dependencies', function () {
    var loadingSpy = jasmine.createSpy('load').and.callFake(function (url, cb) {
      cb();
    });

    spyOn(IOC, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: loadingSpy
        }
      };
    });

    IOC({
      exposeIoc: true,
      context: {
        dependencies: {
          default: {
            sync: [
              '1'
            ],
            async: [
              '2'
            ]
          }
        }
      }
    });

    expect(loadingSpy.calls.count()).toEqual(2);
    expect(loadingSpy).toHaveBeenCalledWith('1', jasmine.any(Function));
    expect(loadingSpy).toHaveBeenCalledWith('2', jasmine.any(Function));
  });

  it('should fetch no dependencies if mode is unknown', function () {
    var loadingSpy = jasmine.createSpy('load').and.callFake(function (url, cb) {
      cb();
    });

    spyOn(IOC, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: loadingSpy
        }
      };
    });

    IOC({
      exposeIoc: true,
      context: {
        dependencies: {
          mmm: {
            sync: [
              '1'
            ],
            async: [
              '2'
            ]
          }
        }
      }
    });

    expect(loadingSpy.calls.count()).toEqual(0);
  });

  it('should wire instances', function () {
    spyOn(IOC, 'Extra');
    IOC({
      exposeIoc: true,
      context: {
        instances: {
          one: {
            namespace: 'IOC.Extra'
          }
        }
      }
    });

    expect(IOC.Extra).toHaveBeenCalled();
  });

  //it('should extend ioc if instance is configured to do so', function () {
  //  IOC.Extra = function () {
  //    return {yay: 'yay'};
  //  };
  //  IOC({
  //    exposeIoc: true,
  //    context: {
  //      instances: {
  //        extension: true,
  //        one: {
  //          namespace: 'IOC.Extra'
  //        }
  //      }
  //    }
  //  });
  //
  //  expect(window.ioc.yay).toEqual('yay');
  //});

  it('should wire dependencies on other instances', function () {
    IOC({
      exposeIoc: true,
      context: {
        instances: {
          one: {
            namespace: 'IOC.Object',
            args: [{ref: 'two'}]
          },
          two: {
            namespace: 'IOC.Object'
          }
        }
      }
    });
  });

  it('should throw error on circular references', function () {
    expect(function () {
      IOC({
        exposeIoc: true,
        context: {
          instances: {
            one: {
              namespace: 'IOC.Object',
              args: [{ref: 'two'}]
            },
            two: {
              namespace: 'IOC.Object',
              args: [{ref: 'one'}]
            }
          }
        }
      });
    }).toThrow('Make sure you don\'t have circular dependencies, Unable to resolve the following instances: one, two');
  });

  it('should throw error on wire unknown instances', function () {
    expect(function () {
      IOC({
        exposeIoc: true,
        context: {
          instances: {
            one: {
              namespace: 'IOC.Extra3'
            }
          }
        }
      });
    }).toThrow('Unknown function "IOC.Extra3"');
  });

});