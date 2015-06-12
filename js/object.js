/*global Arenite:true*/
// Collection of utility functions to handle objects.
// This is an integral part for the usage of the Namespace pattern since this provides the ability to, for example,
// retrieve the functions by namespace.
Arenite.Object = function () {

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

  var _merge = function (arr1, arr2, keepDups) {
    var result = [];
    arr1.forEach(function (el) {
      result.push(el);
    });
    arr2.forEach(function (el) {
      result.push(el);
    });
    return keepDups ? result : _uniq(result);
  };

  var _extract = function (obj, prop) {
    var result = [];
    for (var _key in obj) {
      if (obj.hasOwnProperty(_key)) {
        result.push(obj[_key][prop]);
      }
    }
    return result;
  };
  
  var _obj = function (arr, key) {
    var obj = {};
    arr.forEach(function (elem) {
      obj[_getInObject(elem, key)] = elem;
    });
    return obj;
  };

  var _forEach = function (obj, func) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        func(obj[key], key);
      }
    }
  };

  var _values = function (obj) {
    var key;
    var arr = [];
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(obj[key]);
      }
    }
    return arr;
  };
  
  return {
    object: {
      //###object.get
      // Retrieves a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // get(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be fetched.
      get: _getInObject,
      //###object.set
      // Sets a property in an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // set(object, path, value)
      //</pre></code>
      //where *<b>object</b>* is the target object,
      // *<b>path</b>* is the path of the value and *<b>value</b>* the value to be set at the given path.
      set: _setInObject,
      //###object.delete
      // Removes a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // get(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be deleted.
      delete: _deleteInObject,
      //###object.extend
      // Extend merges to objects. The second object will "override" properties also existing in the first.
      //<pre><code>
      // extend(object, other)
      //</pre></code>
      //where *<b>object</b>* is the object to be merged and extended by *<b>other</b>*.
      extend: _extend,
      //###object.keys
      //Returns all the properties available to an object in the form of an array.
      //<pre><code>
      // keys(object)
      //</pre></code>
      //where *<b>object</b>* is the object from which the properties will be extracted.
      keys: _keys,
      //###object.forEach
      //Iterates through the object the equivalent to the way forEach works for arrays.
      //<pre><code>
      // forEach(object, func(elem, key))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      forEach: _forEach,
      //###object.values
      //Returns all the values available to an object in the form of an array.
      //<pre><code>
      // keys(object)
      //</pre></code>
      //where *<b>object</b>* is the object from which the elements will be extracted.
      values: _values,
      //###object.contains
      // Determines if a element is present in an array or a key exists in an object:
      //<pre><code>
      // contains(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      contains: _contains
    },
    array: {
      //###array.contains
      // Determines if a element is present in an array or a key exists in an object:
      //<pre><code>
      // contains(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      contains: _contains,
      //###array.uniq
      // Filters an array returning a new one with the unique values.
      //<pre><code>
      // contains(array)
      //</pre></code>
      //where *<b>array</b>* is the array to be stripped o duplicate values
      uniq: _uniq,
      //###array.merge
      // Merges two arrays returning a new one with the unique values.
      //<pre><code>
      // merge(arr1, arr2)
      //</pre></code>
      //where *<b>arr1</b>* and *<b>arr2</b>* are the arrays to be merged
      merge: _merge,
      //###array.extract
      // Extract an array composed of a specified property of the subobjects of a given object
      //<pre><code>
      // extract(object, property)
      //</pre></code>
      //where *<b>object</b>* is the object whose members will be analysed *<b>property</b>* the property to be extracted from those members
      extract: _extract,
      //###array.obj
      // Extract an object indexed by a given key
      //<pre><code>
      // obj(array, property)
      //</pre></code>
      //where *<b>array</b>* is the array whose members will be analysed *<b>property</b>* the property of each element to be turned into the key of that element in the resulting object
      obj: _obj
    }
  };
};
