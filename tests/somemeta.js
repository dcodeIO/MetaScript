//? if (typeof WHAT === 'undefined') WHAT = false;
//? if (typeof VERSION === 'undefined') VERSION = '1.0.0';
//? // this just suppresses a line break
MyLibrary.VERSION = /*?== VERSION */;
// or, alternatively, if VERSION is always string-safe:
MyLibrary.VERSION = "/*?= VERSION */";
// or, alternatively, if you don't mind a missing trailing semicolon:
MyLibrary.VERSION = //?== VERSION
// or, alternatively, if you like it procedural:
MyLibrary.VERSION = /*? write(JSON.stringify(VERSION)) */;
// or, if you like it as a number even if you shouldn't:
MyLibrary.VERSION = /*?== parseFloat(VERSION) */;

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

/*? // This is a utility function:
myIndent = function(s) {
    write(indent(s+'\n', __));
}
*/
// Here the utility function is used:
    //? myIndent('hello("world");');

//? // This is a macro:
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
// This will be indented:
    //? if (YEP) include("someinclude.js")

console.log(/*?== "that's it" */);
