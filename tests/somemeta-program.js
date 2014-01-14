// Meta program for: tests\somemeta.js
// generated with metac v0.9.3 on Tue Jan 14 2014 05:52:58 GMT+0100 (Mitteleuropäische Zeit)
if (typeof WHAT === 'undefined') var WHAT = define('WHAT', false);
if (typeof VERSION === 'undefined') var VERSION = define('VERSION', '1.1');
// this just suppresses a line break
  write('MyLibrary.VERSION = ');
write(JSON.stringify(VERSION));
  write(';\r\n');
  write('// or, alternatively, if VERSION is always string-safe:\r\n');
  write('MyLibrary.VERSION = "');
write(VERSION);
  write('";\r\n');
  write('// or, alternatively, if you don\'t mind a missing trailing semicolon:\r\n');
  write('MyLibrary.VERSION = ');
write(JSON.stringify(VERSION));
writeln();
  write('// or, alternatively, if you like it procedural:\r\n');
  write('MyLibrary.VERSION = ');
write(JSON.stringify(VERSION))
  write(';\r\n');
  write('// or, if you like it as a number even if you shouldn\'t:\r\n');
  write('MyLibrary.VERSION = ');
write(JSON.stringify(parseFloat(VERSION)));
  write(';\r\n');
  write('\r\n');
if (WHAT) {
  write('console.log("WHAT\'s true");\r\n');
} else {
  write('console.log("WHAT\'s false");\r\n');
}
  write('\r\n');
if (WHAT)
  write('console.log("WHAT\'s true");\r\n');
else
  write('console.log("WHAT\'s false");\r\n');
  write('\r\n');
  write('console.log(');
if (WHAT) {
  write('"WHAT\'s true"+');
} else {
  write('"WHAT\'s false"+');
}
  write('"");\r\n');
  write('\r\n');
// This is a utility function:
function myIndent(s) {
    write(indent(s+'\n', __));
}
  write('// Here the utility function is used:\r\n');
__='    ';
myIndent('hello("world");');
  write('\r\n');
__='';
// This is a macro:
function assertOffset(varname) {
  write('    if (');
write(varname);
  write(' < 0 || ');
write(varname);
  write(' > this.capacity()) {\r\n');
  write('        throw(new RangeError("Illegal ');
write(varname);
  write('"));\r\n');
  write('    }\r\n');
}
  write('function writeInt8(value, offset) {\r\n');
  write('    // Here the macro is used:\r\n');
__='    ';
assertOffset('offset');
  write('    // ...\r\n');
  write('}\r\n');
  write('\r\n');
  write('// This will be indented:\r\n');
  write('    ');
write('var i=0;');
writeln();
  write('// Just like this:\r\n');
write(indent('var j=0;\n', 4));
  write('// But this will not:\r\n');
write('var k=0;\n');
  write('// Got it?\r\n');
  write('\r\n');
__='';
var YEP = define("YEP", true);
  write('// This will be indented:\r\n');
__='    ';
if(YEP) include("someinclude.js")
  write('\r\n');
  write('console.log(');
write(JSON.stringify("that's it"));
  write(');\r\n');
