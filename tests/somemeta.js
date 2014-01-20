//? if (typeof WHAT === 'undefined') WHAT = false;
//? if (typeof VERSION === 'undefined') VERSION = '1.0.0';
//?
// Line expressions

//? if (WHAT) {
console.log("WHAT's true");
//? } else {
console.log("WHAT's false");
//? }

// Block expressions

/*? if (WHAT) */
console.log("WHAT's true");
/*? else */
console.log("WHAT's false");

console.log(/*? if (WHAT) { */"WHAT's true"+/*? } else { */"WHAT's false"+/*? } */"");

// Snippets

// before snippet
//?...
function bleh() {}
//?.
// after snippet

// ?= expressions

MyLibrary.VERSION = /*?== VERSION */;
// or, alternatively, if VERSION is always string-safe:
MyLibrary.VERSION = "/*?= VERSION */";
// or, alternatively, if you don't mind a missing trailing semicolon:
MyLibrary.VERSION = //?== VERSION
// or, alternatively, if you like it procedural:
MyLibrary.VERSION = /*? write(JSON.stringify(VERSION)) */;
// or, if you like it as a number even if you shouldn't:
MyLibrary.VERSION = /*?== parseFloat(VERSION) */;

// Utility functions using __

/*? myIndent = function(s) {
    write(indent(s+'\n', __));
} */
    //? myIndent('hello("world");');

// Macros

//? ASSERT_OFFSET = function(varname) {
    if (/*?= varname */ < 0 || /*?= varname */ > this.capacity()) {
        throw(new RangeError("Illegal /*?= varname */"));
    }
//? }
function writeInt8(value, offset) {
    // Here the macro is used:
    //? ASSERT_OFFSET('offset');
    // ...
}
      
// Indentation, includes and variable visibility

// This will be indented (it's a ?= expression):
    //?= 'var i=0;'
// Just like this (it uses manual indentation):
    //? write(indent('var j=0;\n', 4));
// Or this (it prepends __):
    //? write(__+'var k=0;\n');
// But this will not:
    //? write('var k=0;\n');
// Got it?

//? YEP = true;
//? var NOPE = false;
// var NOPE = //?= NOPE
// This will be indented:
    //? if (YEP) include("someinclude.js")
    // indented once
// not indented

// snip-snap

//? snip();
console.log("snippet");
//? var snippet = snap();
//?= snippet + snippet
    
// Before end
//?
