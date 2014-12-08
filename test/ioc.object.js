/*global IOC:true, describe:true, it:true, expect:true, beforeEach */
describe("IOC.Object", function () {
  var obj;
  var sample;

  beforeEach(function () {
    obj = IOC.Object();
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
    expect(obj.object.get(sample, 'a.b')).toBe('c');
  });

  it("should return undefined if get is performed on invalid path", function () {
    expect(obj.object.get(sample, 'a.b.d.f.s')).toBe(undefined);
  });

  it("should return undefined if get is performed on undefined object", function () {
    expect(obj.object.get(undefined, 'a.b.d.f.s')).toBe(undefined);
  });

  it("should set value given path", function () {
    obj.object.set(sample, 'a.b', 'd');
    expect(sample.a.b).toBe('d');
  });

  it("should do nothing if set is performed on invalid path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.set(sample, 'a.b.d.f.s', 'asd');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if set is performed on undefined object", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.set(undefined, 'a.b.d.f.s', 'asd');
    expect(sample).toEqual(sampleClone);
  });

  it("should delete value given path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    delete sampleClone.a.d;
    obj.object.delete(sample, 'a.d');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if delete is performed on invalid path", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.delete(sample, 'a.b.d.f.s');
    expect(sample).toEqual(sampleClone);
  });

  it("should do nothing if delete is performed on undefined object", function () {
    var sampleClone = JSON.parse(JSON.stringify(sample));
    obj.object.delete(undefined, 'a.b.d.f.s');
    expect(sample).toEqual(sampleClone);
  });

  it("should return keys for object", function () {
    expect(obj.object.keys(sample.a)).toEqual(['b', 'd', 'f', 'z']);
  });

  it("should return keys for array", function () {
    expect(obj.object.keys(sample.a.f)).toEqual(['0', '1', '2', '3']);
  });

  it("should extend object", function () {
    var extension = {
      a: {
        i: 'j',
        z: ['w', 'x']
      }
    };
    var extended = obj.object.extend(sample, extension);

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

  it("should return true when array contains element", function () {
    expect(obj.array.contains(sample.a.f, 'g')).toBe(true);
  });

  it("should return false when array doesn\'t contain element", function () {
    expect(obj.array.contains(sample.a.f, 'i')).toBe(false);
  });

  it("should return true when object contains key", function () {
    expect(obj.array.contains(sample, 'a')).toBe(true);
  });

  it("should return false when object doesn\'t have key", function () {
    expect(obj.array.contains(sample, 'k')).toBe(false);
  });

  it("should clean array duplicate entries", function () {
    expect(obj.array.uniq(sample.a.f)).toEqual(['g', 'h']);
  });

  it("should do nothing when array has no duplicate entries", function () {
    expect(obj.array.uniq(sample.a.z)).toEqual(sample.a.z);
  });
});