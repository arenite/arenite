/*global Arenite:true, describe:true, it:true, expect:true */
describe("Arenite.Url", function () {

  it("should return null for non existing query params", function () {
    //expect(true).toBe(true);
    expect(Arenite.Url().url.query().mode).toBe(undefined);
  });

  it("should return param for single query param", function () {
    //expect(true).toBe(true);
    window.location.hash = '?mode=aha';
    expect(Arenite.Url().url.query().test1).toBe('test1');
    window.location.hash = '';
  });

  it("should return value array for multiple query param with same name", function () {
    //expect(true).toBe(true);
    expect(Arenite.Url().url.query().test2).toEqual(['test2', 'another2', 'yetanother2']);
  });

});