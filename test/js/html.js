/*global Arenite:true, describe:true, it:true, expect:true, jasmine:true */
describe("Arenite.Html", function () {
  it("should correctly encode html", function () {
    expect(Arenite.Html().html.escape('á&')).toBe('á&amp;');
  });

  it("should correctly decode html", function () {
    expect(Arenite.Html().html.unescape('á&amp;')).toBe('á&');
  });
});