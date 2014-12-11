/*global IOC:true, describe:true, it:true, expect:true, spyOn:true, jasmine:true */
describe("IOC Core", function () {
  it("should load the di module", function () {
    var di = {di: jasmine.createSpyObj('di', ['loadConfig'])};

    spyOn(IOC, 'Loader');
    spyOn(IOC, 'Async');
    spyOn(IOC, 'Url');
    spyOn(IOC, 'DI').and.returnValue(di);
    spyOn(IOC, 'Object').and.callThrough();

    IOC();

    expect(IOC.Loader).toHaveBeenCalled();
    expect(IOC.Async).toHaveBeenCalled();
    expect(IOC.Url).toHaveBeenCalled();
    expect(IOC.DI).toHaveBeenCalled();
    expect(IOC.Object).toHaveBeenCalled();

    expect(di.di.loadConfig).toHaveBeenCalled();
  });
});