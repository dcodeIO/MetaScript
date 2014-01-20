console.log(/*?== "included" */);

// This will be indented once more:
    //? if (YEP) include("sub/someotherinclude.js");

// This should say 'undefined' as NOPE is not visible in other files:
// //?= typeof NOPE

// This should say 'undefined' as filename is not visible in __runProgram:
// //?= typeof filename === 'undefined' ? 'undefined' : filename

