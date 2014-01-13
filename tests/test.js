var fs = require("fs"),
    path = require("path"),
    MetaScript = require(path.join(__dirname, "..", "MetaScript.js"));

var source = fs.readFileSync(path.join(__dirname, "somemeta.js")),
    meta = new MetaScript(source);

console.log("--PROGRAM--");
console.log(meta.program);

var transform = meta.transform({
    WHAT: true
}, __dirname);

console.log("--TRANSFORM--");
console.log(transform);
