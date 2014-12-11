/*global IOC:true, describe:true, it:true, expect:true, spyOn:true, jasmine:true */
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

  it("should include script tag on head when loadScript is used", function () {
    var tag;
    var head = {
      appendChild: jasmine.createSpy('appendChild').and.callFake(function (el) {
        tag = el;
      })
    };
    document.getElementsByTagName = function () {
      return [head];
    };
    var loader = IOC.Loader();
    loader.loader.loadScript('asd');
    expect(head.appendChild).toHaveBeenCalled();
  });

  it("loadScript should not invoke callback until script is loaded", function () {
    var tag;
    var head = {
      appendChild: jasmine.createSpy('appendChild').and.callFake(function (el) {
        tag = el;
      })
    };
    document.getElementsByTagName = function () {
      return [head];
    };
    var loader = IOC.Loader();
    var cb = jasmine.createSpy('cb');
    loader.loader.loadScript('asd', cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it("loadScript should invoke callback if one is defined when script is loaded", function () {
    var tag = null;
    var head = {
      appendChild: jasmine.createSpy('appendChild').and.callFake(function (el) {
        tag = el;
      })
    };
    document.getElementsByTagName = function () {
      return [head];
    };
    var loader = IOC.Loader();
    var cb = jasmine.createSpy('cb');
    loader.loader.loadScript('asd', cb);
    tag.onload();
    expect(cb).toHaveBeenCalled();
  });
});