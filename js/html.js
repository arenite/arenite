/*global Arenite:true*/
// Collection of utility functions to handle html.
Arenite.Html = function (arenite) {

  var _escape = function (text) {
    var span = document.createElement('span');
    span.innerText = text;
    return span.innerHTML;
  };

  var _unescape = function (text) {
    var span = document.createElement('span');
    span.innerHTML = text;
    return span.innerText;
  };

  return {
    html: {
      escape: _escape,
      unescape: _unescape
    }
  };
};