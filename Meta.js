/**
 * Constructs a new Meta instance.
 * @param {string} source Source to process
 * @constructor
 */
var Meta = function(source) {

    /**
     * Source to process.
     * @type {string}
     */
    this.source = source+"";
};

/**
 * Compiles the source to a meta program.
 * @returns {string} Meta program
 */
Meta.prototype.compile = function() {
    var index = 0,                 // Current working index
        expr = /(\/\/\?|\/\*\?)/g, // Line/block expression
        exprLine = /\n|$/g,        // Line terminator
        exprBlock = /\*\//g,       // Block terminator
        match, matchEnd,           // Matches
        s,                         // Temporary string
        out = [];                  // Output stack

    // Escapes a string to be used in a JavaScript string enclosed in single quotes
    function escape(s) {
        return s.replace(/'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    }

    function evaluate(expr) {
        if (expr.substring(0, 2) === '==') {
            return 'write(JSON.stringify('+expr.substring(2).trim()+'));\n';
        } else if (expr.substring(0, 1) === '=') {
            return 'write('+expr.substring(1).trim()+');\n';
        } else {
            return expr+'\n';
        }
    }

    // Turn the meta inside out:
    while (match = expr.exec(this.source)) {

        // Get leading contents
        s = this.source.substring(index, match.index);

        // Look if it is a line or a block of meta
        if (match[1] === '//?') { // Line

            // Trim whitespaces in front of the line
            s = s.replace(/\n\s+$/, '\n');

            // Append leading contents if not empty
            if (s !== '') out.push('  write(\''+escape(s)+'\');\n');

            // Find the end of the line
            exprLine.lastIndex = match.index;
            matchEnd = exprLine.exec(this.source);

            // Evaluate expression
            out.push(evaluate(this.source.substring(match.index+3, matchEnd.index).trim()));

            // Move on
            index = matchEnd.index+1;

        } else { // Block

            // Trim whitespaces in front of the block if it is using a dedicated line
            s = s.replace(/\n[ ]+$/, '\n');

            // Append leading contents if not empty
            if (s !== '') out.push('  write(\''+escape(s)+'\');\n');

            // Find the end of the block
            exprBlock.lastIndex = match.index;
            if (matchEnd = exprBlock.exec(this.source)) {

                // Evaluate expression
                out.push(evaluate(this.source.substring(match.index+3, matchEnd.index).trim()));

                // Move on
                index = matchEnd.index+2;

                // Trim whitespaces after the block if using a dedicated line
                if (this.source.substr(index, 2) === '\r\n')
                    index += 2;
                else if (this.source.substr(index, 1) === '\n')
                    index += 1;

            } else throw(new Error("Unterminated meta block at "+match.index));
        }
        expr.lastIndex = index;
    }

    // Append the remaining contents if not empty
    s = this.source.substring(index);
    if (s !== '') out.push('  write(\''+escape(s)+'\');\n');

    // And return the meta program
    return out.join('');
};

/**
 * Transforms a meta program according to the specified scope.
 * @param {string} program Meta program
 * @param {Object=} scope Scope
 */
Meta.transform = function(program, scope) {
    var vars = [];
    for (var k in (scope || {})) {
        if (scope.hasOwnProperty(k)) {
            vars.push("var "+k+" = "+JSON.stringify(scope[k])+";\n");
        }
    }
    var out = [];
    function write(s) {
        out.push(s+"");
    }
    eval(vars.join('')+program);
    return out.join('');
};

var source = require("fs").readFileSync("./tests/somemeta.js"),
    program = new Meta(source).compile();

console.log("--PROGRAM--");
console.log(program);

var build = Meta.transform(program, {
    WHAT: false
});

console.log("--TRANSFORM--");
console.log(build);
