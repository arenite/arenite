/*global Arenite:true, describe:true, it:true, expect:true, jasmine:true*/
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

  //it("should be able to retrieve factory instances from the context", function () {
  //  var context = Arenite.Context({
  //    di: {
  //      resolveArgs: function () {
  //        return [];
  //      }
  //    }
  //  });
  //  var factory = function () {
  //    return {a: 'b'};
  //  };
  //  context.context.add('instanceName', factory, true);
  //  expect(context.context.get('instanceName')).toEqual(factory());
  //});

  //it("should be able to retrieve factory instances with arguments from the context", function () {
  //  var context = Arenite.Context({
  //    di: {
  //      resolveArgs: function () {
  //        return ['1'];
  //      }
  //    }
  //  });
  //
  //  context.context.add('instanceName', function (arg) {
  //    return arg;
  //  }, true, [{value: '1'}]);
  //
  //  expect(context.context.get('instanceName')).toBe('1');
  //});

  //it("should be able to retrieve different instances from factory instances on each retrieve", function () {
  //  var context = Arenite.Context({
  //    di: {
  //      resolveArgs: function () {
  //        return [];
  //      }
  //    }
  //  });
  //  var factory = function () {
  //    return window.performance.now();
  //  };
  //  context.context.add('instanceName', factory, true);
  //  expect(context.context.get('instanceName')).not.toEqual(context.context.get('instanceName'));
  //});

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

  it("should remove instance if instance exists", function () {
    var objectDelete = jasmine.createSpy('delete');
    var originalDelete = Object.prototype.deleteInPath;
    Object.prototype.deleteInPath = objectDelete;
    var context = Arenite.Context({
      di: {
        resolveArgs: function () {
          return [];
        }
      }
    });
    context.context.add('a', 'a');
    context.context.remove('a');
    Object.prototype.deleteInPath = originalDelete;
    expect(objectDelete).toHaveBeenCalledWith('a');
  });

  it("window.define: register instances", function () {
    var callback = function () {
      return 'instance';
    };
    var context = Arenite.Context({});
    window.define('testInstance', [], callback);
    expect(context.context.get('testInstance')).toBe('instance');
  });

  it("window.define: register instances using the script name when not provided", function () {
    var callback = function () {
      return 'instance';
    };
    var context = Arenite.Context({});
    window.define([], callback);
    expect(context.context.get('context')).toBe('instance');
  });

  it("window.define: will resolve deps", function () {
    var dep;
    var callback = function (arg) {
      dep = arg;
      return 'instance';
    };
    var context = Arenite.Context({});
    context.context.add('dep', 't');
    window.define(['dep'], callback);
    expect(context.context.get('context')).toBe('instance');
    expect(dep).toBe('t');
  });


});