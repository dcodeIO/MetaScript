// MetaScript program for: tests\someinclude.js
// generated on 2014-01-16T22:09:50.704Z with metac v0.15.0
  write('// NOPE = ');
write(typeof NOPE);
writeln();
  write('console.log(');
write(JSON.stringify("included"));
  write(');\r\n');
  write('\r\n');
  write('// This will be indented once more:\r\n');
__='    ';
if (YEP) include("sub/someotherinclude.js");
