/*global IOC:true, describe:true, it:true, expect:true, jasmine:true */
describe("IOC.Async", function () {
  it('Latch should trigger when countDown hits 0', function () {
    var callback = jasmine.createSpyObj('callback', ['callback']).callback;
    var latch = IOC.Async().async.latch(1, callback);
    latch.countDown();
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toBe(1);
  });

  it('Latch should trigger when countUp hits 0', function () {
    var callback = jasmine.createSpy('callback');
    var latch = IOC.Async().async.latch(-1, callback);
    latch.countUp();
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toBe(1);
  });

  it('Latch should trigger on "times" independent of countDown and countUp', function () {
    var callback = jasmine.createSpy('callback');
    var latch = IOC.Async().async.latch(1, callback);
    latch.countUp();
    latch.countUp();
    latch.countDown();
    latch.countDown();
    latch.countDown();
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toBe(1);
  });

  it('Sequencial Latch should trigger when executions are completed', function () {
    var callback = jasmine.createSpy('callback');
    var latch = IOC.Async().async.seqLatch(['asd'], function () {
      latch.next();
    }, callback);
    latch.next();
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toBe(1);
  });

  it('Sequencial Latch should call handler for each of the values', function () {
    var callback = jasmine.createSpy('callback');
    var handler = jasmine.createSpy('handler');
    var latch = IOC.Async().async.seqLatch(['asd','dsa'], handler, callback);
    handler.and.callFake(function () {
      latch.next();
    });
    latch.next();
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toBe(1);
    expect(handler).toHaveBeenCalled();
    expect(handler.calls.count()).toBe(2);
  });

});
