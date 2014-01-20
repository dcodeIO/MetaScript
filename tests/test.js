var fs = require("fs"),
    path = require("path"),
    MetaScript = require(path.join(__dirname, "..", "MetaScript.js"));

var filename = path.join(__dirname, "somemeta.js");
var source = fs.readFileSync(filename),
    program = MetaScript.compile(source);

console.log("--PROGRAM--");
console.log(program);

source = MetaScript.transform(source, filename, { WHAT:  true });

console.log("--TRANSFORM--");
console.log(source);
