/*global Arenite:true, describe:true, it:true, expect:true, spyOn:true, jasmine:true */
describe("Arenite Core", function () {
  it("should initialize the di module", function () {
    var di = {di: jasmine.createSpyObj('di', ['init'])};

    spyOn(Arenite, 'Loader');
    spyOn(Arenite, 'Async');
    spyOn(Arenite, 'Url');
    spyOn(Arenite, 'DI').and.returnValue(di);
    spyOn(Arenite, 'Object').and.callThrough();

    Arenite();

    expect(Arenite.Loader).toHaveBeenCalled();
    expect(Arenite.Async).toHaveBeenCalled();
    expect(Arenite.Url).toHaveBeenCalled();
    expect(Arenite.DI).toHaveBeenCalled();
    expect(Arenite.Object).toHaveBeenCalled();

    expect(di.di.init).toHaveBeenCalled();
  });
});