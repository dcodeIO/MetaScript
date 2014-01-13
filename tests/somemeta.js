//? if (typeof WHAT === 'undefined') var WHAT = define('WHAT', false);

//? if (WHAT) {
console.log("it's true");
//? } else {
console.log("it's false");
//? }

/*? if (WHAT) */
console.log("it's true");
/*? else */
console.log("it's false");

console.log(/*? if (WHAT) { */ "it's true"+ /*? } else { */ "it's false" /*? } */);

//? function assertOffset(varname) {
    if (/*?= varname */ < 0 || /*?= varname */ > this.capacity()) {
        throw(new RangeError("Illegal /*?= varname */"));
    }
//? }
ByteBuffer.prototype.writeInt8(value, offset) {
    //? assertOffset('offset');
    // ...
}

//? define("YEP", true);
//? include("someinclude.js")

console.log(/*?== "that's it" */);
