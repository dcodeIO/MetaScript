// MetaScript program for: tests\someinclude.js
// generated on 2014-01-15T14:28:34.593Z with metac v0.14.0
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
