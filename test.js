"use strict";

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// Because IE8 won't let us use the .delete() method in the ES6 set interface
//   our polyfill has a .remove() method which does the same thing
// In order to allow our test code to work in IE8, it is coded to use .remove().
// So that it will also work with the native ES6 Set, we add a .remove() to it
// that has the same functionality as .delete
;(function() {
    // if no .remove() method, add one
    if (!Set.prototype.remove) {
        // define a .remove() synonym for .delete()
        // so we can use it in our test code that has to also run in IE8
        Set.prototype.remove = Set.prototype["delete"];
    }
})();

function inArray(arr, item) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === item) {
            return i;
        }
    }
    return -1;
}

function getKeys(set) {
    var iter = set.keys(), next, keys = [];
    while ((next = iter.next()) && !next.done) {
        keys.push(next.value);
    }
    return keys;
}

function runSetTests(elem) {
    var indentLevel = 0;
    var indentPerLevel = 20;
    function output(/* one or more args */) {
        var str = "", item;
        for (var i = 0; i < arguments.length; i++) {
            item = arguments[i];
            if (typeof item === "string") {
                str += item;
            } else if (item instanceof Set) {
                str += JSON.stringify(getKeys(item));
            } else {
                str += JSON.stringify(item);
            }
        }
        var o = document.createElement("div");
        o.style.marginLeft = (indentLevel * indentPerLevel) + "px";
        o.innerHTML = str;
        elem.appendChild(o);
    }
    
    function outputIndent(level, array) {
        var priorIndent = indentLevel;
        indentLevel = level;
        for (var i = 0; i < array.length; i++) {
            output.call(this, array[i]);
        }
        indentLevel = priorIndent;
    }

    if (typeof elem === "string") {
        elem = document.getElementById(elem);
    }
    
    function _verify(s, t) {
        // forms of input here
        // _verify(Set, array of keys)
        // _verify(array, array)
        // _verify(value, value) - string, number, boolean
        if (s instanceof Set || Array.isArray(s)) {
            // if s is a Set, then get its keys
            // if s is not a Set, we assume it to be an array and we just compare s and t as arrays
            var keys;
            if (Array.isArray(s)) {
                keys = s;
            } else {
                keys = getKeys(s);
            }
            
            // verify that s contains exactly the keys in the array t
            // we could use Set features more easily to test this, but
            // we don't want to use sets themselves to test sets, so
            // we go brute force here
            var missing = [];
            var extra = [];
            var errors = [];
            // verify that every item in keys is in t
            for (var i = 0; i < keys.length; i++) {
                if (inArray(t, keys[i]) < 0) {
                    extra.push(keys[i]);
                }
            }
            // verify that every item in t is in keys
            for (i = 0; i < t.length; i++) {
                if (inArray(keys, t[i]) < 0) {
                    missing.push(t[i]);
                }
            }
            if (keys.length !== t.length) {
                errors.push("Set length is not what was expected: " + keys.length + " !== " + t.length);
            }
            if (extra.length) {
                errors.push("Set contains extra keys: " + JSON.stringify(extra));
            }
            if (missing.length) {
                errors.push("Set is missing keys: " + JSON.stringify(missing));
            }
            if (errors.length) {
                return errors;
            }
            return null;
        } else {
            if (s === t) {
                return null;
            } else {
                return ["operation did not return expected result: " + s + " !== " + t];
            }
        }
    }
    
    function verify(title, s, t) {
        var ret = _verify(s, t);
        if (!ret) {
            output("Passed: " + title);
        } else {
            output("Failed: " + title);
            outputIndent(1, ret);
        }
    }
    
    function addByArray(set, array) {
        for (var i = 0; i < array.length; i++) {
            set.add(array[i]);
        }
    }
    
    // capture all errors so we can show them in the results
    try {
        // output a message that indicates whether we're testing native or polyfill
        var x = new Set();
        if (x.baseType === "Set") {
            output("Testing polyfill ES6 Set() object...");
        } else {
            output("Testing native ES6 Set() object...");
        }
        
        // test all forms of .add() and constructor
        x = new Set([1,2]);
        x.add(3);
        verify(".add()", x, [1,2,3]);
        var y = new Set(x);
        y.add(4);
        verify("Constructor takes Set", y, [1,2,3,4]);
        // try some tough properties with potentially conflicting names
        x.add("hasOwnProperty");
        x.add("constructor");
        verify(".has('hasOwnProperty')", x.has("hasOwnProperty"), true);
        verify(".has('constructor')", x.has("constructor"), true);
        x.remove("hasOwnProperty");
        x.remove("constructor");
        // code uses .remove() so this can run in IE8
        // which won't let us use .delete()
        verify(".delete()", x, [1,2,3]);
        
        // test .delete()
        x.remove(2);
        verify(".delete(3) === true", x.remove(3), true);
        verify(".delete(4) === false", x.remove(4), false);
        verify(".delete()", x, [1]);
        
        // test .has()
        verify(".has(9)", x.has(2), false);
        verify(".has(2)", x.has(1), true);
        verify(".has({})", x.has({}), false);
        verify(".delete(9)", x.remove(9), false);
        
        // test .size
        verify(".size #1", x.size === 1, true);
        var y = new Set();
        y.add(1);
        try {
            y.size = -1;
        } catch(e) {}
        verify(".size can't be set", y.size === 1, true);
        y = new Set([1]);
        y.remove(1);
        verify(".size() #2", y.size === 0, true);

        // test .clear()
        y.add(1);
        y.add(2);
        y.add(3);
        y.clear();
        verify(".clear()", y.size === 0, true);
        
        x = new Set();
        var obj1 = {name: "hello"};
        var obj2 = {name: "goodbye"};
        var fn1 = function() {alert(1);};
        var fn2 = function() {alert(1);};
        var data = [1,2,3,3.414, "1", "2", "3", true, false, null, undefined, obj1, obj2, fn1, fn2]
        addByArray(x, data);
        verify("multiple conflicting types", x, data);
        
        // .forEach()
        verify(".forEach.length", x.forEach.length, 1);
        var results = [];
        x.forEach(function(item) {
            results.push(item);
        });
        verify(".forEach()", x, results);
        
        // test DOM nodes in the set and DOM collections
        var nodes = document.getElementsByTagName("span");
        x = new Set(nodes);
        verify("dom collection in Set(" + nodes.length + ")", x, nodes);
        
        // .values()
        
        // .keys()
        
        // .entries()

    } catch(e) {
        output("Error: ", e.message);
        throw e;
    }
    
}
