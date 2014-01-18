// NOPE = //?= typeof NOPE
console.log(/*?== "included" */);

// This will be indented once more:
    //? if (YEP) include("sub/someotherinclude.js");

// This should say 'undefined' as it's not visible in __eval:
// //?= typeof filename

