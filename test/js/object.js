/*global Arenite:true, describe:true, it:true, expect:true, beforeEach */
describe("Arenite.Object", function () {
  var obj;
  var sample;

  beforeEach(function () {
    obj = Arenite.Object();
    sample = {
      a: {
        b: 'c',
        d: 'e',
        f: ['g', 'h', 'h', 'h'],
        z: ['y', 'w']
      }
    };
  });

  it("should get value given path", function () {
    expect(obj.object.getInPath(sample, 'a.b')).toBe('c');
  });

  it("should return undefined if get is performed on invalid path", function () {
    expect(obj.object.getInPath(sample, 'a.b.d.f.s')).toBe(undefined);
  });

  it("should return undefined if get is performed on undefined object", function () {
    expect(obj.object.getInPath(undefined, 'a.b.d.f.s')).toBe(undefined);
  });

  it("should set value given path", function () {
    obj.object.setInPath(sample, 'a.b', 'd');
    expect(sample.a.b).toBe('d');
  });

  it("should do nothing if set is performed on invalid path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.setInPath(sample, 'a.b.d.f.s', 'asd');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if set is performed on undefined object", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.setInPath(undefined, 'a.b.d.f.s', 'asd');
    expect(sample).toEqual(sampleClone);
  });

  it("should delete value given path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    delete sampleClone.a.d;
    obj.object.deleteInPath(sample, 'a.d');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if delete is performed on invalid path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.deleteInPath(sample, 'a.b.d.f.s');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if delete is performed on undefined object", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.deleteInPath(undefined, 'a.b.d.f.s');
    expect(sample).toEqual(sampleClone);
  });

  it("should return keys for object", function () {
    expect(obj.object.toKeyArray(sample.a)).toEqual(['b', 'd', 'f', 'z']);
  });

  it("should return keys for array", function () {
    expect(obj.object.toKeyArray(sample.a.f)).toEqual(['0', '1', '2', '3']);
  });

  it("should extend object", function () {
    var extension = {
      a: {
        i: 'j',
        z: ['w', 'x']
      }
    };
    var extended = obj.object.fuseWith(sample, extension);

    expect(extended).toEqual({
      a: {
        b: 'c',
        d: 'e',
        f: ['g', 'h', 'h', 'h'],
        z: ['y', 'w', 'x'],
        i: 'j'
      }
    });
  });

  it("should the object filtered by the given keys", function () {
    expect(obj.object.filterWith({a: 'a', b: 'b', c: 'c'}, ['a', 'b'])).toEqual({a: 'a', b: 'b'});
  });

  it("should convert object to array", function () {
    expect(obj.object.toArray({a: 'a', b: 'b', c: 'c'})).toEqual(['a', 'b', 'c']);
  });

  it("should transform array of obj to array of subObj", function () {
    expect(obj.array.toObject([{a: 'a'}, {a: 'b'}, {a: 'c'}], 'a')).toEqual({
      a: {a: 'a'},
      b: {a: 'b'},
      c: {a: 'c'}
    });
  });

  it("should transform array of obj to array of subObj", function () {
    expect(obj.array.toArrayOf([{a: 'a'}, {a: 'b'}, {a: 'c'}], 'a')).toEqual(['a', 'b', 'c']);
  });

  it("should return true when array contains element", function () {
    expect(obj.array.containsElement(sample.a.f, 'g')).toBe(true);
  });

  it("should return false when array doesn\'t contain element", function () {
    expect(obj.array.containsElement(sample.a.f, 'i')).toBe(false);
  });

  it("should return true when object contains key", function () {
    expect(obj.array.containsElement(sample, 'a')).toBe(true);
  });

  it("should return false when object doesn\'t have key", function () {
    expect(obj.array.containsElement(sample, 'k')).toBe(false);
  });

  it("should clean array duplicate entries", function () {
    expect(obj.array.filterUnique(sample.a.f)).toEqual(['g', 'h']);
  });

  it("should do nothing when array has no duplicate entries", function () {
    expect(obj.array.filterUnique(sample.a.z)).toEqual(sample.a.z);
  });

  it("should merge arrays and return new with unique", function () {
    expect(obj.array.mergeWith(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it("should find first matching element on simple array", function () {
    expect(obj.array.findWhere(['a', 'a', 'b'], function (el) {
      return el === 'a';
    })).toEqual('a');
  });

  it("should find first matching element on object array", function () {
    expect(obj.array.findWhere(
      [
        {'a': true, order: 1},
        {'a': true, order: 2},
        {b: true, order: 3},
        {b: true, order: 4}
      ], function (el) {
        return el.b;
      })).toEqual({'b': true, order: 3});
  });

  it("should find all matching elements on simple array", function () {
    expect(obj.array.findAllWhere(['a', 'a', 'b'], function (el) {
      return el === 'a';
    })).toEqual(['a', 'a']);
  });

  it("should find all matching element on object array", function () {
    expect(obj.array.findAllWhere(
      [
        {'a': true, order: 1},
        {'a': true, order: 2},
        {b: true, order: 3},
        {b: true, order: 4}
      ], function (el) {
        return el.b;
      })).toEqual([{b: true, order: 3}, {b: true, order: 4}]);
  });

  it("should collect elements on simple array", function () {
    expect(obj.array.collectWhere(['a', 'a', 'b'], function (el) {
      return el === 'a' ? 1 : undefined;
    })).toEqual([1, 1]);
  });

  it("should collect elements on object array", function () {
    expect(obj.array.collectWhere(
      [
        {'a': true, order: 1},
        {'a': true, order: 2},
        {b: true, order: 3},
        {b: true, order: 4}
      ], function (el) {
        return el.b ? {order: el.order} : undefined;
      })).toEqual([{order: 3}, {order: 4}]);
  });


  it("should find first matching element on simple object", function () {
    expect(obj.object.findWhere({a: 1, b: 2, c: 3}, function (el) {
      return el === 2;
    })).toEqual({b: 2});
  });

  it("should find first matching element on complex object", function () {
    expect(obj.object.findWhere(
      {
        1: {'a': true, order: 1},
        2: {'a': true, order: 2},
        3: {b: true, order: 3},
        4: {b: true, order: 4}
      }, function (el) {
        return el.b;
      })).toEqual({3: {'b': true, order: 3}});
  });

  it("should find all matching elements on simple object", function () {
    expect(obj.object.findAllWhere({a: 1, b: 2, c: 3, d: 2}, function (el) {
      return el === 2;
    })).toEqual({b: 2, d: 2});
  });

  it("should find all matching element on complex object", function () {
    expect(obj.object.findAllWhere(
      {
        1: {'a': true, order: 1},
        2: {'a': true, order: 2},
        3: {b: true, order: 3},
        4: {b: true, order: 4}
      }, function (el) {
        return el.b;
      })).toEqual({3: {b: true, order: 3}, 4: {b: true, order: 4}});
  });

  it("should collect elements on simple object", function () {
    expect(obj.object.collectWhere({a: 1, b: 2, c: 3, d: 2}, function (el) {
      return el === 2 ? {val: el} : undefined;
    })).toEqual({b: {val: 2}, d: {val: 2}});
  });

  it("should collect elements on complex object", function () {
    expect(obj.object.collectWhere(
      {
        1: {'a': true, order: 1},
        2: {'a': true, order: 2},
        3: {b: true, order: 3},
        4: {b: true, order: 4}
      }, function (el) {
        return el.b ? {order: el.order} : undefined;
      })).toEqual({3: {order: 3}, 4: {order: 4}});
  });

});