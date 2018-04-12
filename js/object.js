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
          if (source[f].constructor === Array && target[f] && target[f].constructor === Array) {
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

  var _merge = function (arr1, arr2) {
    return _uniq(arr1.concat(arr2));
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

  var _array = function (obj) {
    var arr = [];
    _forEach(obj, function (el) {
      arr.push(el);
    });
    return arr;
  };

  var _filter = function (obj, keys) {
    var filtered = {};
    keys.forEach(function (key) {
      if (obj.hasOwnProperty(key)) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  };

  var _find = function (obj, func) {
    var isArray = Array.isArray(obj);
    var match;
    _forEach(obj, function (val, key) {
      if (!match && func(val, key)) {
        if (isArray) {
          match = val;
        } else {
          match = {};
          match[key] = val;
        }
      }
    });
    return match;
  };

  var _findBy = function (obj, key, val) {
    return _find(obj, function (elem) {
      return (key ? _getInObject(elem, key) : elem) === val;
    });
  };

  var _findAll = function (obj, func) {
    var isArray = Array.isArray(obj);
    var matches = isArray ? [] : {};
    _forEach(obj, function (val, key) {
      if (func(val, key)) {
        if (isArray) {
          matches.push(val);
        } else {
          matches[key] = val;
        }
      }
    });
    return matches;
  };

  var _findAllBy = function (obj, key, val) {
    return _findAll(obj, function (elem) {
      return (key ? _getInObject(elem, key) : elem) === val;
    });
  };

  var _collect = function (obj, func) {
    var isArray = Array.isArray(obj);
    var collection = isArray ? [] : {};
    _forEach(obj, function (val, key) {
      var result = func(val, key);
      if (result !== undefined) {
        if (isArray) {
          collection.push(result);
        } else {
          collection[key] = result;
        }
      }
    });
    return collection;
  };

  var _collectBy = function (obj, key) {
    return obj.collectWhere(function (elem) {
      return _getInObject(elem, key);
    });
  };

  return {
    object: {
      //### object.getFromPath
      // Retrieves a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // getFromPath(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be fetched.
      getInPath: _getInObject,
      //### object.setInPath
      // Sets a property in an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // setInPath(object, path, value)
      //</pre></code>
      //where *<b>object</b>* is the target object,
      // *<b>path</b>* is the path of the value and *<b>value</b>* the value to be set at the given path.
      setInPath: _setInObject,
      //### object.deleteInPath
      // Removes a property from an object. The property is expressed as a string, denoting a path.
      //<pre><code>
      // deleteInPath(object, path)
      //</pre></code>
      //where *<b>object</b>* is the target object and *<b>path</b>* is the path of the value to be deleted.
      deleteInPath: _deleteInObject,
      //### object.fuseWith
      // Fuse merges objects. The second object will "override" properties also existing in the first.
      //<pre><code>
      // fuseWith(object, other)
      //</pre></code>
      //where *<b>object</b>* is the object to be merged and extended by *<b>other</b>*.
      fuseWith: _extend,
      //### object.keysOf
      //Returns all the properties available to an object in the form of an array.
      //<pre><code>
      // keysOf(object)
      //</pre></code>
      //where *<b>object</b>* is the object from which the properties will be extracted.
      toKeyArray: _keys,
      //### object.forEach
      //Iterates through the object the equivalent to the way forEach works for arrays.
      //<pre><code>
      // forEach(object, func(elem, key))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      forEach: _forEach,
      //### object.containsKey
      // Determines if a key exists in an object:
      //<pre><code>
      // containsKey(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      containsKey: _contains,
      //### object.toArray
      // Transforms the object to an array using the values for each key:
      //<pre><code>
      // toArray(object)
      //</pre></code>
      //where *<b>object</b>* is the object to be transformed into the array.
      toArray: _array,
      //### object.filterWith
      // Returns a filtered version of the object:
      //<pre><code>
      // filterWith(object, keys)
      //</pre></code>
      //where *<b>object</b>* is the object to be filtered and *<b>keys</b>* an array of keys to maintain.
      filterWith: _filter,
      //### object.findWhere
      // Find the first occurence of a matching element
      //<pre><code>
      // findWhere(object, func(elem, key))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      //The element is considered to be a match if the result of the function is not undefined.
      findWhere: _find,
      //### object.findBy
      // Find the first occurence of a matching object
      //<pre><code>
      // findBy(object, property, value)
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>property</b>* the property of the object to be used in the comparison. *<b>property</b>* the property value for the element to be considered a match.
      findBy: _findBy,
      //### object.findAllWhere
      // Find all occurences of a matching object
      //<pre><code>
      // findWhere(object, func(elem, idx))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      //The element is considered to be a match if the result of the function is not undefined.
      findAllWhere: _findAll,
      //### object.findAllBy
      // Find all occurences of a matching object
      //<pre><code>
      // findAllBy(object, property, value)
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>property</b>* the property of the object to be used in the comparison. *<b>property</b>* the property value for the element to be considered a match.
      findAllBy: _findAllBy,
      //### object.collectWhere
      // Collect objects for occurences of a matching object
      //<pre><code>
      // collectWhere(object, func(elem, idx))
      //</pre></code>
      //where *<b>object</b>* is the object to iterate. *<b>func(elem, key)</b>* is the function called for each element and receives the element and its key.
      //The resulting object will contain all elements returned by the function (where the result is not undefined).
      collectWhere: _collect,
      //### object.collectBy
      // Collect sub objects
      //<pre><code>
      // findWhere(object, property)
      //</pre></code>
      //where *<b>object</b>* is the array to iterate. *<b>property</b>* is the object path to be collected.
      collectBy: _collectBy
    },
    array: {
      //### array.containsElement
      // Determines if a element is present in an array:
      //<pre><code>
      // containsElement(object, key)
      //</pre></code>
      //where *<b>object</b>* is the object to test for the presence of key and *<b>key</b>* is the property/element to be tested.
      containsElement: _contains,
      //### array.filterUnique
      // Filters an array returning a new one with the unique values.
      //<pre><code>
      // filterUnique(array)
      //</pre></code>
      //where *<b>array</b>* is the array to be stripped o duplicate values
      filterUnique: _uniq,
      //### array.mergeWith
      // Merges two arrays returning a new one with the unique values.
      //<pre><code>
      // mergeWith(arr1, arr2)
      //</pre></code>
      //where *<b>arr1</b>* and *<b>arr2</b>* are the arrays to be merged
      mergeWith: _merge,
      //### array.toArrayOf
      // Extract an array composed of a specified property of the subobjects of a given object
      //<pre><code>
      // toArrayOf(object, property)
      //</pre></code>
      //where *<b>object</b>* is the object whose members will be analysed *<b>property</b>* the property to be extracted from those members
      toArrayOf: _extract,
      //### array.toObject
      // Extract an object indexed by a given key
      //<pre><code>
      // toObject(array, property)
      //</pre></code>
      //where *<b>array</b>* is the array whose members will be analysed *<b>property</b>* the property of each element to be turned into the key of that element in the resulting object
      toObject: _obj,
      //### array.findWhere
      // Find the first occurence of a matching object
      //<pre><code>
      // findWhere(array, func(elem, idx))
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>func(elem, idx)</b>* is the function called for each element and receives the element and its index.
      //The element is considered to be a match if the result of the function is not undefined.
      findWhere: _find,
      //### array.findBy
      // Find the first occurence of a matching object
      //<pre><code>
      // findBy(array, property, value)
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>property</b>* the property of the object to be used in the comparison. *<b>property</b>* the property value for the element to be considered a match.
      findBy: _findBy,
      //### array.findAllWhere
      // Find all occurences of a matching object
      //<pre><code>
      // findWhere(array, func(elem, idx))
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>func(elem, idx)</b>* is the function called for each element and receives the element and its index.
      //The element is considered to be a match if the result of the function is not undefined.
      findAllWhere: _findAll,
      //### array.findAllBy
      // Find all occurences of a matching object
      //<pre><code>
      // findAllBy(array, property, value)
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>property</b>* the property of the object to be used in the comparison. *<b>property</b>* the property value for the element to be considered a match.
      findAllBy: _findAllBy,
      //### array.collectWhere
      // Collect objects in array
      //<pre><code>
      // collectWhere(array, func(elem, idx))
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>func(elem, idx)</b>* is the function called for each element and receives the element and its index.
      //The resulting array will contain all elements returned by the function (where the result is not undefined).
      collectWhere: _collect,
      //### array.collectBy
      // Collect sub objects
      //<pre><code>
      // findWhere(array, property)
      //</pre></code>
      //where *<b>array</b>* is the array to iterate. *<b>property</b>* is the object path to be collected.
      collectBy: _collectBy
    }
  };
};
