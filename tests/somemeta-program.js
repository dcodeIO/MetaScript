// Meta program for: tests\somemeta.js
// generated with metac v0.9.0 on Tue Jan 14 2014 01:36:20 GMT+0100 (Mitteleuropäische Zeit)
if (typeof WHAT === 'undefined') var WHAT = define('WHAT', false);
if (WHAT) {
  write('console.log("it\'s true");\r\n');
} else {
  write('console.log("it\'s false");\r\n');
}
  write('\r\n');
if (WHAT)
  write('console.log("it\'s true");\r\n');
else
  write('console.log("it\'s false");\r\n');
  write('\r\n');
  write('console.log(');
if (WHAT) {
  write(' "it\'s true"+ ');
} else {
  write(' "it\'s false" ');
}
  write(');\r\n');
  write('\r\n');
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
__='    ';
  write('function writeInt8(value, offset) {\r\n');
assertOffset('offset');
__='';
  write('    // ...\r\n');
  write('}\r\n');
  write('\r\n');
var YEP = define("YEP", true);
if(YEP) include("someinclude.js")
  write('\r\n');
  write('console.log(');
write(JSON.stringify("that's it"));
  write(');\r\n');
