/*global Arenite:true, describe:true, it:true, expect:true*/
describe('Arenite.Context', function () {
  it("should be able to add and retrieve instances from the context", function () {
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return [];
        }
      }
    });
    var instance = 'something';
    context.context.add('instanceName', instance, false);
    expect(context.context.get('instanceName')).toBe(instance);
  });

  it("should be able to retrieve factory instances from the context", function () {
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return [];
        }
      }
    });
    var factory = function () {
      return {a: 'b'};
    };
    context.context.add('instanceName', factory, true);
    expect(context.context.get('instanceName')).toEqual(factory());
  });

  it("should be able to retrieve factory instances with arguments from the context", function () {
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return ['1'];
        }
      }
    });

    context.context.add('instanceName', function (arg) {
      return arg;
    }, true, [{value: '1'}]);

    expect(context.context.get('instanceName')).toBe('1');
  });

  it("should be able to retrieve different instances from factory instances on each retrieve", function () {
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return [];
        }
      }
    });
    var factory = function () {
      return window.performance.now();
    };
    context.context.add('instanceName', factory, true);
    expect(context.context.get('instanceName')).not.toEqual(context.context.get('instanceName'));
  });

  it("should return undefined for unknown instances", function () {
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return [];
        }
      }
    });
    expect(context.context.get('instanceName')).toBe(undefined);
  });
});