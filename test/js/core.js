/*global Arenite:true, describe:true, it:true, expect:true, spyOn:true, jasmine:true */
describe("Arenite Core", function () {
  it("should initialize the di module", function () {
    var di = {di: jasmine.createSpyObj('di', ['init'])};

    spyOn(Arenite, 'Object').and.callThrough();
    spyOn(Arenite, 'Loader').and.returnValue({loader: {}});
    spyOn(Arenite, 'Async').and.returnValue({async: {}});
    spyOn(Arenite, 'Url').and.returnValue({url: {}});
    spyOn(Arenite, 'DI').and.returnValue(di);


    Arenite();

    expect(Arenite.Loader).toHaveBeenCalled();
    expect(Arenite.Async).toHaveBeenCalled();
    expect(Arenite.Url).toHaveBeenCalled();
    expect(Arenite.DI).toHaveBeenCalled();
    expect(Arenite.Object).toHaveBeenCalled();

    expect(di.di.init).toHaveBeenCalled();
  });

  it("should add the object functions to it\'s prototype", function () {
    var di = {di: jasmine.createSpyObj('di', ['init'])};

    spyOn(Arenite, 'Object').and.callThrough();
    spyOn(Arenite, 'Loader').and.returnValue({loader: {}});
    spyOn(Arenite, 'Async').and.returnValue({async: {}});
    spyOn(Arenite, 'Url').and.returnValue({url: {}});
    spyOn(Arenite, 'DI').and.returnValue(di);
    Object.defineProperty(Object.prototype, 'toKeyArray', {value:null})

    Arenite();

    expect(Arenite.Loader).toHaveBeenCalled();
    expect(Arenite.Async).toHaveBeenCalled();
    expect(Arenite.Url).toHaveBeenCalled();
    expect(Arenite.DI).toHaveBeenCalled();
    expect(Arenite.Object).toHaveBeenCalled();

    expect(({'a': 1}).toKeyArray()).toEqual(['a']);
  });

  it("should add the array functions to it\'s prototype", function () {
    var di = {di: jasmine.createSpyObj('di', ['init'])};

    spyOn(Arenite, 'Object').and.callThrough();
    spyOn(Arenite, 'Loader').and.returnValue({loader: {}});
    spyOn(Arenite, 'Async').and.returnValue({async: {}});
    spyOn(Arenite, 'Url').and.returnValue({url: {}});
    spyOn(Arenite, 'DI').and.returnValue(di);
    Object.defineProperty(Array.prototype, 'filterUnique', {value:null})

    Arenite();

    expect(Arenite.Loader).toHaveBeenCalled();
    expect(Arenite.Async).toHaveBeenCalled();
    expect(Arenite.Url).toHaveBeenCalled();
    expect(Arenite.DI).toHaveBeenCalled();
    expect(Arenite.Object).toHaveBeenCalled();

    expect(([1, 1, 1, 1, 1]).filterUnique()).toEqual([1]);
  });
});