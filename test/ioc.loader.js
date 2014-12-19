/*global IOC:true, describe:true, it:true, expect:true, jasmine:true */
describe("IOC.Loader", function () {
  it("should invoke callback on successful load", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = IOC.Loader();

    var callback = jasmine.createSpy('callback');
    loader.loader.loadResource('asd', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 200;
    xmlHttpReq.onreadystatechange();
    expect(callback).toHaveBeenCalledWith(xmlHttpReq);
  });

  it("should invoke error callback on unsuccessful load", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = IOC.Loader();

    var callback = jasmine.createSpy('callback');
    var error = jasmine.createSpy('error');
    loader.loader.loadResource('asd', callback, error);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 404;
    xmlHttpReq.onreadystatechange();
    expect(error).toHaveBeenCalledWith(xmlHttpReq);
  });

  it("should not generate exception on error when error callback is not defined on an unsuccessful load", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = IOC.Loader();

    var callback = jasmine.createSpy('callback');
    loader.loader.loadResource('asd', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 404;
    xmlHttpReq.onreadystatechange();
    expect(callback).not.toHaveBeenCalledWith();
  });

});