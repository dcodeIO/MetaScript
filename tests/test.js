var MetaScript = require("../MetaScript.js");

var source = require("fs").readFileSync("./tests/somemeta.js"),
    meta = new MetaScript(source);

console.log("--PROGRAM--");
console.log(meta.program);

var transform = meta.transform({
    WHAT: true
}, __dirname);

console.log("--TRANSFORM--");
console.log(transform);
