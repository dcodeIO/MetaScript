var fs = require("fs"),
    path = require("path"),
    MetaScript = require(path.join(__dirname, "..", "MetaScript.js"));

var source = fs.readFileSync(path.join(__dirname, "somemeta.js")),
    program = MetaScript.compile(source);

console.log("--PROGRAM--");
console.log(program);

source = MetaScript.transform(source, "somemeta.js", { WHAT:  true }, __dirname);

console.log("--TRANSFORM--");
console.log(source);
