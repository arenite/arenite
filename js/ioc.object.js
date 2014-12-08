/*global IOC:true*/
IOC.Object = function () {

  var _navigateToBeforeLast = function (object, path) {
    if (!object) {
      return;
    }

    var split = path.split(".");
    var last = split.splice(split.length - 1, 1);

    var result = object;
    split.forEach(function (pathEl) {
      if (!result) {
        return;
      }
      if (!result[pathEl]) {
        result[pathEl] = {};
      }
      result = result[pathEl];
    });
    return {object: result, path: last};
  };

  var _getInObject = function (object, path) {
    if (!object) {
      return;
    }

    var split = path.split(".");
    var result = object;
    split.forEach(function (pathEl) {
      if (!result) {
        return;
      }
      result = result[pathEl];
    });
    return result;
  };

  var _setInObject = function (object, path, element) {
    var beforeLast = _navigateToBeforeLast(object, path);
    if (beforeLast && beforeLast.object) {
      beforeLast.object[beforeLast.path] = element;
      return beforeLast.object[beforeLast.path];
    }
  };

  var _deleteInObject = function (object, path) {
    var beforeLast = _navigateToBeforeLast(object, path);
    if (beforeLast && beforeLast.object) {
      delete beforeLast.object[beforeLast.path];
    }
  };

  var _extend = function (source, target) {
    for (var f in target) {
      if (target.hasOwnProperty(f)) {
        if (source[f] && typeof source[f] === 'object') {
          if (source[f].constructor === Array && target[f].constructor === Array) {
            source[f] = _uniq(source[f].concat(target[f]));
          } else {
            _extend(source[f], target[f]);
          }
        } else {
          source[f] = target[f];
        }
      }
    }
    return source;
  };

  var _keys = function (obj) {
    var keys = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  var _contains = function (obj, key) {
    if (obj.length) {
      var result = false;
      obj.forEach(function (_key) {
        result = result || _key === key;
      });
      return result;
    } else {
      for (var _key in obj) {
        if (obj.hasOwnProperty(_key)) {
          if (_key === key) {
            return true;
          }
        }
      }
    }
    return false;
  };

  var _uniq = function (arr) {
    var result = [];
    arr.forEach(function (el) {
      if (result.indexOf(el) < 0) {
        result.push(el);
      }
    });
    return result;
  };

  return {
    object: {
      get: _getInObject,
      set: _setInObject,
      delete: _deleteInObject,
      extend: _extend,
      keys: _keys
    },
    array: {
      contains: _contains,
      uniq: _uniq
    }
  };
};