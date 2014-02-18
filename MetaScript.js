/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license MetaScript (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/MetaScript for details
 */ //
module.exports = (function() {
    // not strict for global var shenanigans

    /**
     * Current meta program version.
     * @type {string}
     */
    var __version = require(__dirname+"/package.json")['version'];
    
    /**
     * Constructs a new MetaScript instance.
     * @exports MetaScript
     * @param {string} sourceOrProgram Source to compile or meta program to run
     * @param {string=} filename Source file name if known, defaults to `"main"`.
     * @constructor
     */
    var MetaScript = function(sourceOrProgram, filename) {
        
        if (!(this instanceof MetaScript)) {
            __version = Array.prototype.join.call(arguments, '.');
            return;
        }
        
        // Whether constructing from a meta program or, otherwise, a source
        var isProgram = (sourceOrProgram+="").substring(0, 11) === 'MetaScript(';
        
        /**
         * Original source.
         * @type {?string}
         */
        this.source = isProgram ? null : sourceOrProgram;

        /**
         * Original source file name.
         * @type {string}
         */
        this.filename = filename || "main";

        /**
         * The compiled meta program's source.
         * @type {string}
         */
        this.program = isProgram ? sourceOrProgram : MetaScript.compile(sourceOrProgram);
    };
    
    /**
     * MetaScript version.
     * @type {string}
     * @const
     */
    MetaScript.VERSION = __version;

    /**
     * Compiles the specified source to a meta program and returns its source.
     * @param {string} source Source
     * @returns {string} Meta program
     */
    MetaScript.compile = function(source) {
        source = source+"";

        var index = 0,                              // Current working index
            expr = /(\/\/\?|\/\*\?)((?:=|\.\.\.)?)/g, // Line/block/snippet expression
            exprLine = /(\r?\n|$)/g,                // Line terminator
            exprBlock = /\*\//g,                    // Block terminator
            exprEnd = /(\/\/\?\.(?:\r?\n|$))/g,     // Snippet terminator
            exprEmpty = /(^|\n)([ \t]*)$/,          // Empty line expression
            match, matchEnd,                        // Matches
            s,                                      // Temporary string
            indent = '',                            // Indentation
            lastIndent = '',                        // Last indentation
            out = [],                               // Output stack
            empty;                                  // Line empty?
        
        out.push('MetaScript('+MetaScript.VERSION.split('.')+');\n');

        // Escapes a string to be used in a JavaScript string enclosed in single quotes
        function escapestr(s) {
            return s.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
        }

        // Evaluates a meta expression
        function evaluate(expr) {
            if (expr.substring(0, 2) === '==') {
                return 'write(JSON.stringify('+expr.substring(2).trim()+'));\n';
            } else if (expr.substring(0, 1) === '=') {
                return 'write('+expr.substring(1).trim()+');\n';
            } else if (expr.substring(0, 3) === '...') {
                expr = '//...\n'+expr.substring(3).trim()+'\n//.';
            }
            if (expr !== '') {
                return expr+'\n';
            }
            return '';
        }

        // Appends additional content to the program, if not empty
        function append(source) {
            if (s === '') return;
            var index = 0,
                expr = /\n/g,
                s,
                match;
            while (match = expr.exec(source)) {
                s = source.substring(index, match.index+1);
                if (s !== '') out.push('  write(\''+escapestr(s)+'\');\n');
                index = match.index+1;
            }
            s = source.substring(index, source.length);
            if (s !== '') out.push('  write(\''+escapestr(s)+'\');\n');
        }

        // Turn the meta inside out:
        while (match = expr.exec(source)) {

            // Get leading contents
            s = source.substring(index, match.index);
            
            empty = exprEmpty.test(s);

            // Look if it is a line or a block of meta
            if (match[1].indexOf('*') < 0) { // Line //? asd
                                
                // Trim whitespaces in front of the line and remember the indentation
                if (match[2] !== '=')
                    s = s.replace(exprEmpty, function($0, $1, $2) { indent = $2; return $1; });
                
                // Append leading contents
                append(s);

                if (match[2] === '...') { // Start meta                    
                    // Find the end of the snippet
                    exprEnd.lastIndex = match.index;
                    matchEnd = exprEnd.exec(source);
                } else {
                    // Find the end of the line
                    exprLine.lastIndex = match.index;
                    matchEnd = exprLine.exec(source);
                }

                // Expose indentation and evaluate expression
                if (indent !== lastIndent) {
                    out.push('__=\''+escapestr(lastIndent = indent)+'\';\n');
                }
                out.push(evaluate(source.substring(match.index+3, matchEnd.index).trim()));
                if (!empty || match[2] === '=')
                    out.push('writeln();\n');
                
                // Move on
                index = matchEnd.index + matchEnd[0].length;

            } else { // Block

                // Trim whitespaces in front of the block and remember the indentation
                if (match[2] !== '=')
                    s = s.replace(/(^|\n)([ \t]*)$/, function($0, $1, $2) { indent = $2; return $1; });
                
                // Append leading contents
                append(s);

                // Find the end of the block
                exprBlock.lastIndex = match.index;
                if (matchEnd = exprBlock.exec(source)) {

                    // Expose indentation and evaluate expression
                    if (indent !== lastIndent) {
                        out.push('__=\''+escapestr(lastIndent = indent)+'\';\n');
                    }
                    out.push(evaluate(source.substring(match.index+3, matchEnd.index).trim()));

                    // Move on
                    index = matchEnd.index+2;

                    // Trim whitespaces after the block if using a dedicated line
                    if (source.substr(index, 2) === '\r\n') {
                        index += 2;
                    } else if (source.substr(index, 1) === '\n')
                        index += 1;

                } else throw(new Error("Unterminated meta block at "+match.index));
            }
            expr.lastIndex = index;
        }

        // Append the remaining contents
        append(source.substring(index));

        // And return the program
        return out.join('');
    };

    /**
     * Compiles the source to a meta program and transforms it using the specified scope in a new VM context.
     * @param {string} source Source
     * @param {string=} filename Source file name
     * @param {!Object} scope Scope
     * @returns {string} Transformed source
     */
    MetaScript.transform = function(source, filename, scope) {
        if (typeof filename === 'object') {
            scope = filename;
            filename = "main";
        }
        var vm = require("vm"),
            sandbox;
        vm.runInNewContext('__result = new MetaScript(__source, __filename).transform(__scope);', sandbox = {
            __source   : source,
            __filename : filename,
            __scope    : scope,
            MetaScript : MetaScript
        });
        return sandbox.__result;
    };

    /**
     * Runs the meta program with the specified scope in the current context and returns the final document. This method
     *  should always be invoked in a fresh or otherwise safe context, so if you do not know exactly what you are doing,
     *  use {@link MetaScript.transform} instead, which always creates a fresh VM context before calling this method.
     * @param {Object} scope Scope
     * @returns {string} Transformed source
     */
    MetaScript.prototype.transform = function(scope) {
        var vars = [];
        for (var k in (scope || {})) {
            if (scope.hasOwnProperty(k)) {
                vars.push(k+" = "+JSON.stringify(scope[k])+";\n");
            }
        }
        var __program,   // Current meta program
            __filename,  // Current source file name
            __dirname,   // Current source file directory name
            __source,    // Current source
            __    = '',  // Current indentation level
            __out = [],  // Output buffer
            __snip = -1; // Snipping indicator

        ///////////////////////////////////////////// Built-in functions ///////////////////////////////////////////////
        
        /**
         * Writes some contents to the document (no indentation).
         * @function write
         * @param {*} s Contents to write
         */
        function write(s) {
            __out.push(s+"");
        }

        /**
         * Writes some contents to the document, followed by a new line.
         * @function writeln
         * @param {*} s Contents to write
         */
        function writeln(s) {
            if (typeof s === 'undefined') s = '';
            write(s+"\n");
        }

        /**
         * Begins a snipping operation at the current offset of the output.
         * @function
         */
        function snip() {
            __snip = __out.length;
        }

        /**
         * Ends a snipping operation, returning the (suppressed) output between the two calls to {@link snip} and
         *  this function.
         * @function
         * @returns {string}
         */
        function snap() {
            if (__snip < 0)
                throw(new Error("Illegal call to snap(): Not snipping"));
            var snipped = __out.splice(__snip, __out.length - __snip).join('');
            __snip = -1;
            return snipped;
        }

        /**
         * Extracts the directory name from a file name.
         * @function dirname
         * @param {string} filename File name
         * @returns {string} Directory name
         */
        function dirname(filename) {
            return require("path").dirname(filename);
        }

        /**
         * Indents a block of text.
         * @function indent
         * @param {string} str Text to indent
         * @param {string|number} indent Whitespace text to use for indentation or the number of whitespaces to use
         * @returns {string} Indented text
         */
        function indent(str, indent) {
            if (typeof indent === 'number') {
                var indent_str = '';
                while (indent_str.length < indent) indent_str += ' ';
                indent = indent_str;
            }
            var lines = str.split(/\n/);
            for (var i=0; i<lines.length; i++) {
                if (lines[i].trim() !== '')
                    lines[i] = indent + lines[i];
            }
            return lines.join("\n");            
        }

        /**
         * Includes another source file.
         * @function include
         * @param {string} filename File to include. May be a glob expression on node.js.
         * @param {boolean} absolute Whether the path is absolute, defaults to `false` for a relative path
         */
        function include(filename, absolute) {
            filename = absolute
                ? filename
                : __dirname + '/' + filename;
            var _program  = __program,  // Previous meta program
                _source   = __source,   // Previous source
                _filename = __filename, // Previous source file
                _dirname  = __dirname,  // Previous source directory
                _indent   = __;         // Previous indentation level
            var files;
            if (/(?:^|[^\\])\*/.test(filename)) {
                files = require("glob").sync(filename, { cwd : __dirname, nosort: true });
                files.sort(naturalCompare); // Sort these naturally (e.g. int8 < int16)
            } else {
                files = [filename];
            }
            files.forEach(function(file) {
                var source = require("fs").readFileSync(file)+"";
                __program = MetaScript.compile(indent(source, __));
                __source = source;
                __filename = file;
                __dirname = dirname(__filename);
                __runProgram();
                __program = _program;
                __source = _source;
                __filename = _filename;
                __dirname = _dirname;
                __ = _indent;
            });
        }

        /**
         * Escaoes a string to be used inside of a single or double quote enclosed JavaScript string.
         * @function escapestr
         * @param {string} s String to escape
         * @returns {string} Escaped string
         */
        function escapestr(s) {
            return s.replace(/\\/g, '\\\\')
                    .replace(/'/g, '\\\'')
                    .replace(/"/g, '\\"')
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n');
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Runs a meta program.
         * @inner
         * @private
         */
        function __runProgram() {
            try {
                eval(__program);
            } catch (err) {
                if (err.rethrow) throw(err);
                err = new Error(err.message+" in meta program of '"+__filename+"':\n"+__err2code(__program, err));
                err.rethrow = true;
                throw(err);
            }
        }
        
        /**
         * Generates a code view of eval'ed code from an Error.
         * @param {string} program Failed program
         * @param {!Error} err Error caught
         * @returns {string} Code view
         * @inner
         * @private
         */
        function __err2code(program, err) {
            if (typeof err.stack !== 'string')
                return indent(program, 4);
            var match = /<anonymous>:(\d+):(\d+)\)/.exec(err.stack);
            if (!match) {
                return indent(program, 4);
            }
            var line = parseInt(match[1], 10)-1,
                start = line - 3,
                end = line + 4,
                lines = program.split("\n");
            if (start < 0) start = 0;
            if (end > lines.length) end = lines.length;
            var code = [];
            start = 0; end = lines.length;
            while (start < end) {
                code.push(start === line ? "--> "+lines[start] : "    "+lines[start]);
                start++;
            }
            return indent(code.join('\n'), 4);
        }
        
        __program = vars.join('')+this.program;
        vars = undefined;
        __source = this.source;
        __filename = this.filename;
        __dirname = dirname(__filename);
        __runProgram();
        return __out.join('').replace(/[ \t]+(\r?\n)/g, function($0, $1) { return $1; });
    };

    // (*) The use of eval() is - of course - potentially evil, but there is no way around it without making the library
    //     harder to use. To limit the impact we always use a fresh VM context under node.js in MetaScript.transform.

    /**
     * Compares two strings naturally, like in `"file9" < "file10"`.
     * @param {string} a
     * @param {string} b
     * @returns {number}
     * @version 0.4.4
     * @author Lauri Rooden - https://github.com/litejs/natural-compare-lite
     * @license MIT License - http://lauri.rooden.ee/mit-license.txt
     */
    function naturalCompare(a, b) {
        if (a != b) for (var i, ca, cb = 1, ia = 0, ib = 0; cb;) {
            ca = a.charCodeAt(ia++) || 0;
            cb = b.charCodeAt(ib++) || 0;
            if (ca < 58 && ca > 47 && cb < 58 && cb > 47) {
                for (i = ia; ca = a.charCodeAt(ia), ca < 58 && ca > 47; ia++);
                ca = (a.slice(i - 1, ia) | 0) + 1;
                for (i = ib; cb = b.charCodeAt(ib), cb < 58 && cb > 47; ib++);
                cb = (b.slice(i - 1, ib) | 0) + 1;
            }
            if (ca != cb) return (ca < cb) ? -1 : 1;
        }
        return 0;
    }
    
    return MetaScript;
})();
