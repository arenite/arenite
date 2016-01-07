/*global Arenite:true, describe:true, it:true, expect:true, jasmine:true */
describe("Arenite.Loader", function () {
  it("should invoke callback on successful load using ajax", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = Arenite.Loader({config: {}});

    var callback = jasmine.createSpy('callback');
    loader.loader.loadResource('asd', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 200;
    xmlHttpReq.onreadystatechange();
    expect(callback).toHaveBeenCalledWith(xmlHttpReq);
  });

  it("should invoke error callback on unsuccessful load using ajax", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = Arenite.Loader({config: {}});

    var callback = jasmine.createSpy('callback');
    var error = jasmine.createSpy('error');
    loader.loader.loadResource('asd', callback, error);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 404;
    xmlHttpReq.onreadystatechange();
    expect(error).toHaveBeenCalledWith(xmlHttpReq);
  });

  it("should not generate exception on error when error callback is not defined on an unsuccessful load using ajax", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);

    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = Arenite.Loader({config: {}});

    var callback = jasmine.createSpy('callback');
    loader.loader.loadResource('asd', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 404;
    xmlHttpReq.onreadystatechange();
    expect(callback).not.toHaveBeenCalledWith();
  });

  it("should invoke callback on successful load using tag", function () {
    var script = {};
    spyOn(document, ['getElementsByTagName']).and.returnValue([jasmine.createSpyObj('head', ['appendChild'])]);
    spyOn(document, ['createElement']).and.callFake(function (type) {
      if (type === 'a') {
        return {'async': true};
      } else {
        return script;
      }
    });
    var loader = Arenite.Loader();
    var callback = jasmine.createSpy('callback');
    loader.loader.loadScript('http://somewhereelse/asd.js', callback);
    script.readyState = 'complete';
    script.onreadystatechange();
    expect(callback).toHaveBeenCalled();
  });

  it("should use ajax when resource has same origin", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);
    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = Arenite.Loader({
      annotation: jasmine.createSpyObj('annotationProcessor', ['processAnnotations']),
      config: {}
    });
    var callback = jasmine.createSpy('callback');
    loader.loader.loadScript('asd.js', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 200;
    xmlHttpReq.onreadystatechange();
    expect(callback).toHaveBeenCalled();
  });

  it("should invoke annotation processor when script is loaded", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);
    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var loader = Arenite.Loader({
      annotation: jasmine.createSpyObj('annotationProcessor', ['processAnnotations']),
      config: {}
    });
    var callback = jasmine.createSpy('callback');
    loader.loader.loadScript('asd.js', callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 200;
    xmlHttpReq.onreadystatechange();
    expect(callback).toHaveBeenCalled();
  });

  it("should extract variables from window when structure is used for load", function () {
    var xmlHttpReq = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send', 'setRequestHeader', 'withCredentials']);
    window.XMLHttpRequest = function () {
      return xmlHttpReq;
    };
    var arenite = Arenite.Object();
    arenite = arenite.extend(arenite, {
      annotation: jasmine.createSpyObj('annotationProcessor', ['processAnnotations']),
      config:{}
    });
    arenite = arenite.extend(arenite, Arenite.Context());
    var loader = Arenite.Loader(arenite);
    var callback = jasmine.createSpy('callback');
    window.a = 'a1';
    window.b = 'b1';
    loader.loader.loadScript({
      url: 'asd.js',
      instances: {
        'a': 'a',
        'b': 'b'
      }
    }, callback);
    xmlHttpReq.readyState = 4;
    xmlHttpReq.status = 200;
    xmlHttpReq.onreadystatechange();
    expect(arenite.context.get('a')).toBe('a1');
    expect(arenite.context.get('b')).toBe('b1');
  });

});