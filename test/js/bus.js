/*global Arenite:true, describe:true, it:true, expect:true, beforeEach */
describe("Arenite.Bus", function () {
  var arenite;

  beforeEach(function () {
    arenite = Arenite.Bus();
  });

  it("should receive and pubish events", function (done) {
    var callback = jasmine.createSpy('spy');
    arenite.bus.subscribe('some-event', callback);
    expect(callback).not.toHaveBeenCalled();
    arenite.bus.publish('some-event', {a: 1});
    window.setTimeout(function () {
      expect(callback).toHaveBeenCalledWith({a: 1});
      done();
    });
  });

  it("should not receive events after unsubscribe", function (done) {
    var callback = jasmine.createSpy('callback');
    arenite.bus.subscribe('some-event', callback);
    arenite.bus.unsubscribe('some-event', callback);
    arenite.bus.publish('some-event', {a: 1});
    expect(callback).not.toHaveBeenCalled();
    window.setTimeout(done, 10);
  });

});
