/*global Arenite:true, describe:true, it:true, expect:true, jasmine:true, spyOn:true */
describe("Arenite.DI", function () {
  Arenite.Extra = function () {

  };

  it("should be able to add and retrieve instances from the context", function () {
    var di = Arenite.DI();
    var instance = (function () {
      return {'a': 'b'};
    })();
    di.di.addInstance('instanceName', instance, false);
    expect(di.di.getInstance('instanceName')).toBe(instance);
  });

  it("should be able to retrieve factory instances from the context", function () {
    var di = Arenite.DI();
    var factory = function () {
      return {a: 'b'};
    };
    di.di.addInstance('instanceName', factory, true);
    expect(di.di.getInstance('instanceName')).toEqual(factory());
  });

  it("should be able to retrieve factory instances with arguments from the context", function () {
    var di = Arenite.DI();
    var factory = function (c) {
      return {a: c};
    };
    di.di.addInstance('instanceName', factory, true, [{value: '1'}]);
    expect(di.di.getInstance('instanceName')).toEqual(factory('1'));
  });

  it("should be able to retrieve differnt instances from factory instances on each retrieve", function () {
    var di = Arenite.DI();
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
    var di = Arenite.DI();
    expect(di.di.getInstance('instanceName')).toBe(undefined);
  });

  it("should throw exception if arguments can\'t be resolved", function () {
    var di = Arenite.DI({
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
    var di = Arenite.DI();
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
    var di = Arenite.DI({
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
    Arenite({});
  });

  it('should not expose arenite if option isn\'t true', function () {
    Arenite({
      expose: false
    });
    expect(window.arenite).toBe(undefined);
  });

  it('should expose arenite if option is true', function () {
    Arenite({
      expose: true
    });
    expect(window.arenite).not.toBe(undefined);
  });

  it('should merge config with imports', function () {
    spyOn(Arenite, 'Extra').and.callFake(function () {
      return {
        context: {
          instances: {}
        }
      };
    });
    Arenite({
      expose: true,
      imports: [
        {
          url: 'url',
          namespace: 'Arenite.Extra'
        }
      ]
    });

    expect(window.arenite.config).toEqual({
      expose: true, imports: [{url: 'url', namespace: 'Arenite.Extra'}], mode: 'default', context: {instances: {}}
    });
  });

  it('should fetch and merge config with imports if not already present', function () {
    spyOn(Arenite, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: function (url, cb) {
            Arenite.Extra2 = function () {
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

    Arenite({
      expose: true,
      imports: [
        {
          url: 'url',
          namespace: 'Arenite.Extra2'
        }
      ]
    });

    expect(window.arenite.config).toEqual({
      expose: true, imports: [{url: 'url', namespace: 'Arenite.Extra2'}], mode: 'default', context: {instances: {}}
    });
  });

  it('should fetch dependencies', function () {
    var loadingSpy = jasmine.createSpy('load').and.callFake(function (url, cb) {
      cb();
    });

    spyOn(Arenite, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: loadingSpy
        }
      };
    });

    Arenite({
      expose: true,
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

    spyOn(Arenite, 'Loader').and.callFake(function () {
      return {
        loader: {
          loadScript: loadingSpy
        }
      };
    });

    Arenite({
      expose: true,
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
    spyOn(Arenite, 'Extra');
    Arenite({
      expose: true,
      context: {
        instances: {
          one: {
            namespace: 'Arenite.Extra'
          }
        }
      }
    });

    expect(Arenite.Extra).toHaveBeenCalled();
  });

  it('should extend arenite if extensions is present', function () {
    window.Arenite.Extra = function () {
      return {yay: 'yay'};
    };
    Arenite({
      expose: true,
      context: {
        extensions: {
          one: {
            namespace: 'Arenite.Extra'
          }
        }
      }
    });
    expect(window.arenite.one.yay).toEqual('yay');
  });

  it('should wire dependencies on other instances', function () {
    Arenite({
      expose: true,
      context: {
        instances: {
          one: {
            namespace: 'Arenite.Object',
            args: [{ref: 'two'}]
          },
          two: {
            namespace: 'Arenite.Object'
          }
        }
      }
    });
  });

  it('should throw error on circular references', function () {
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Object',
              args: [{ref: 'two'}]
            },
            two: {
              namespace: 'Arenite.Object',
              args: [{ref: 'one'}]
            }
          }
        }
      });
    }).toThrow('Make sure you don\'t have circular dependencies, Unable to resolve the following instances: one, two');
  });

  it('should throw error on wire unknown instances', function () {
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Extra3'
            }
          }
        }
      });
    }).toThrow('Unknown function "Arenite.Extra3"');
  });

  it('should execute inits', function () {
    var funcSpy = jasmine.createSpy('init');
    spyOn(Arenite, 'Extra').and.returnValue({
      init: funcSpy
    });
    Arenite({
      expose: true,
      context: {
        instances: {
          one: {
            namespace: 'Arenite.Extra',
            init: {
              func: 'init'
            }
          }
        }
      }
    });
    expect(funcSpy).toHaveBeenCalled();
  });

  it('should fail on inits if function does not exist', function () {
    var funcSpy = jasmine.createSpy('init');
    spyOn(Arenite, 'Extra').and.returnValue({
      init: funcSpy
    });
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Extra',
              init: {
                func: 'idonotexist'
              }
            }
          }
        }
      });
    }).toThrow('Unknown function "idonotexist" for instance "one"');
  });

  it('should fail on inits if arguments cannot be resolved', function () {
    var funcSpy = jasmine.createSpy('init');
    spyOn(Arenite, 'Extra').and.returnValue({
      init: funcSpy
    });
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Extra',
              init: {
                func: 'init',
                args: [{ref: 'idonotexist'}]
              }
            }
          }
        }
      });

    }).toThrow('Unable to resolve arguments for "init" of instance "one"');
  });

  it('should execute starts', function () {
    var funcSpy = jasmine.createSpy('start');
    spyOn(Arenite, 'Extra').and.returnValue({
      start: funcSpy
    });
    Arenite({
      expose: true,
      context: {
        instances: {
          one: {
            namespace: 'Arenite.Extra'
          }
        },
        start: [
          {
            instance: 'one',
            func: 'start'
          },
          {
            func: funcSpy
          }
        ]
      }
    });
    expect(funcSpy.calls.count()).toBe(2);
  });

  it('should fail on starts if function does not exist', function () {
    var funcSpy = jasmine.createSpy('start');
    spyOn(Arenite, 'Extra').and.returnValue({
      start: funcSpy
    });
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Extra'
            }
          },
          start: [
            {
              instance: 'one',
              func: 'idontexist'
            },
            {
              func: funcSpy
            }
          ]
        }
      });
    }).toThrow('Unknown function "idontexist" for instance "one"');
  });

  it('should fail on starts if arguments cannot be resolved', function () {
    var funcSpy = jasmine.createSpy('start');
    spyOn(Arenite, 'Extra').and.returnValue({
      start: funcSpy
    });
    expect(function () {
      Arenite({
        expose: true,
        context: {
          instances: {
            one: {
              namespace: 'Arenite.Extra'
            }
          },
          start: [
            {
              instance: 'one',
              func: 'start',
              args: [{ref: 'idontexist'}]
            },
            {
              func: funcSpy
            }
          ]
        }
      });
    }).toThrow('Unable to resolve arguments for "start" of instance "one"');
  });
});