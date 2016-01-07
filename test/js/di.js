/*global Arenite:true, describe:true, it:true, expect:true, jasmine:true, spyOn:true */
describe("Arenite.DI", function () {
  Arenite.Extra = function () {

  };

  it("should return null if arguments can\'t be resolved", function () {
    var di = Arenite.DI({
      deubug: true,
      context: {
        get: function (name) {
          if (name === 'foo') {
            return 'foo';
          } else {
            return null;
          }
        }
      }
    });
    expect(di.di.resolveArgs({instance: 'dummy', func: 'foo', args: [{ref: 'impossible'}]})).toBe(null);
  });

  it("should resolve value arguments", function () {
    var di = Arenite.DI({
      context: {
        get: function (name) {
          if (name === 'foo') {
            return 'foo';
          } else {
            return null;
          }
        }
      }
    });
    expect(di.di.resolveArgs({instance: 'dummy', func: 'foo', args: [{value: 'str'}]})).toEqual(['str']);
  });

  it("should resolve exec arguments", function () {
    var di = Arenite.DI({
      context: {
        get: function (name) {
          if (name === 'foo') {
            return 'foo';
          } else {
            return null;
          }
        }
      }
    });
    var count = 0;
    di.di.resolveArgs({
      instance: 'dummy', func: 'foo', args: [{
        exec: function () {
          count++;
        }
      }]
    });
    expect(count).toBe(1);
  });

  it("should resolve func arguments", function () {
    var di = Arenite.DI({
      context: {
        get: function (name) {
          if (name === 'foo') {
            return 'foo';
          } else {
            return null;
          }
        }
      }
    });
    var actual = di.di.resolveArgs({
      instance: 'dummy',
      func: 'foo',
      args: [{
        func: function () {
        }
      }]
    });
    expect(typeof actual[0]).toBe('function');
  });

  it('can use empty config', function () {
    Arenite({});
  });

  it('should not expose arenite if expose is undefined', function () {
    Arenite({});
    expect(window.arenite).toBe(undefined);
  });

  it('should expose arenite with selected name', function () {
    Arenite({
      expose: 'aren'
    });
    expect(window.aren).not.toBe(undefined);
  });

  it('should expose arenite with function result as name', function () {
    Arenite({
      expose: function () {
        return 'arfun';
      }
    });
    expect(window.arfun).not.toBe(undefined);
  });

  it('should not expose arenite with function if result is false', function () {
    Arenite({
      expose: function () {
        return false;
      }
    });
    expect(window.arfunny).toBe(undefined);
  });

  //it('should merge config with imports', function () {
  //  spyOn(Arenite, 'Extra').and.callFake(function () {
  //    return {
  //      context: {
  //        instances: {}
  //      }
  //    };
  //  });
  //  Arenite({
  //    expose: 'arenite',
  //    imports: [
  //      {
  //        url: 'url',
  //        namespace: 'Arenite.Extra'
  //      }
  //    ]
  //  });
  //
  //  expect(window.arenite.config).toEqual({
  //    expose: 'arenite', imports: [{url: 'url', namespace: 'Arenite.Extra'}], mode: 'default', context: {instances: {}}
  //  });
  //});

  //it('should fetch and merge config with imports if not already present', function () {
  //  spyOn(Arenite, 'Loader').and.callFake(function () {
  //    return {
  //      loader: {
  //        loadScript: function (url, cb) {
  //          Arenite.Extra2 = function () {
  //            return {
  //              context: {
  //                instances: {}
  //              }
  //            };
  //          };
  //          cb();
  //        }
  //      }
  //    };
  //  });
  //
  //  Arenite({
  //    expose: 'arenite',
  //    imports: [
  //      {
  //        url: 'url',
  //        namespace: 'Arenite.Extra2'
  //      }
  //    ]
  //  });
  //
  //  expect(window.arenite.config).toEqual({
  //    expose: 'arenite', imports: [{url: 'url', namespace: 'Arenite.Extra2'}], mode: 'default', context: {instances: {}}
  //  });
  //});

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
      expose: 'arenite',
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
      expose: 'arenite',
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
      expose: 'arenite',
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
    window.Arenite.Extra2 = function () {
      return {
        context: {
          instances: {}
        }
      };
    };
    Arenite({
      expose: 'arenite',
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
      expose: 'arenite',
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
        expose: 'arenite',
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
    }).toThrow('Make sure you don\'t have circular dependencies, Unable to resolve the following instances: one, two - []');
  });

  it('should throw error on wire unknown instances', function () {
    expect(function () {
      Arenite({
        expose: 'arenite',
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
      expose: 'arenite',
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
        expose: 'arenite',
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
        expose: 'arenite',
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
      expose: 'arenite',
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
        expose: 'arenite',
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

  it('should not create factory instances on boot', function () {
    var funcSpy = jasmine.createSpy('init');
    var extra = spyOn(Arenite, 'Extra').and.returnValue({
      init: funcSpy
    });
    Arenite({
      expose: 'arenite',
      context: {
        instances: {
          one: {
            factory: true,
            namespace: 'Arenite.Extra',
            init: 'init'
          }
        }
      }
    });
    expect(extra).not.toHaveBeenCalled();
    expect(funcSpy).not.toHaveBeenCalled();
  });

  it('should execute factory init if one is defined', function () {
    var funcSpy = jasmine.createSpy('init');
    spyOn(Arenite, 'Extra').and.returnValue({
      init: funcSpy
    });
    var arenite = Arenite({
      context: {
        instances: {
          one: {
            factory: true,
            namespace: 'Arenite.Extra',
            init: 'init'
          }
        }
      }
    });

    arenite.context.get('one');
    expect(funcSpy).toHaveBeenCalled();
  });

  it('should create factory anonymous arguments every time', function () {
    var extra = spyOn(Arenite, 'Extra').and.returnValue({});
    var extra2 = spyOn(Arenite, 'Extra2').and.returnValue({});
    var arenite = Arenite({
      context: {
        instances: {
          one: {
            factory: true,
            namespace: 'Arenite.Extra',
            args: [{
              instance: {
                namespace: 'Arenite.Extra2'
              }
            }]
          }
        }
      }
    });
    expect(extra).not.toHaveBeenCalled();
    expect(extra2).not.toHaveBeenCalled();
    arenite.context.get('one');

    expect(extra).toHaveBeenCalled();
    expect(extra2).toHaveBeenCalled();
    arenite.context.get('one');

    expect(extra.calls.count()).toEqual(2, 'Extra calls');
    expect(extra2.calls.count()).toEqual(2, 'Extra2 calls');
  });
});