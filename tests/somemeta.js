//? if (typeof WHAT === 'undefined') var WHAT = define('WHAT', false);
//? if (typeof VERSION === 'undefined') var VERSION = define('VERSION', '1.0');

MyLibrary.VERSION = /*?== VERSION */;
// or, alternatively, if VERSION is always string-safe:
MyLibrary.VERSION = "/*?= VERSION */";
// or, alternatively, if you don't mind a missing trailing semicolon:
MyLibrary.VERSION = //?== VERSION
// or, alternatively, if you like it procedural:
MyLibrary.VERSION = /*? write(JSON.stringify(VERSION)) */;

//? if (WHAT) {
console.log("WHAT's true");
//? } else {
console.log("WHAT's false");
//? }

/*? if (WHAT) */
console.log("WHAT's true");
/*? else */
console.log("WHAT's false");

console.log(/*? if (WHAT) { */"WHAT's true"+/*? } else { */"WHAT's false"+/*? } */"");

//? // This is a macro:
//? function assertOffset(varname) {
    if (/*?= varname */ < 0 || /*?= varname */ > this.capacity()) {
        throw(new RangeError("Illegal /*?= varname */"));
    }
//? }
function writeInt8(value, offset) {
    // Here the macro is used:
    //? assertOffset('offset');
    // ...
}

// This will be indented:
    //?= 'var j=0;'
// Just like this:
    //? write(indent('var j=0;\n', 4));
// But this will not:
    //? write('var k=0;\n');
// Got it?

//? var YEP = define("YEP", true);
// This will be indented:
    //? if(YEP) include("someinclude.js")

console.log(/*?== "that's it" */);
