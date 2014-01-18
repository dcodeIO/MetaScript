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
(function(global) {
    // not strict for global var shenanigans
    
    /**
     * Constructs a new MetaScript instance.
     * @exports MetaScript
     * @param {string} source Source to compile
     * @param {string=} filename Source file name if known, defaults to `"main"`.
     * @constructor
     */
    var MetaScript = function(source, filename) {

        /**
         * Original source.
         * @type {string}
         */
        this.source = source;

        /**
         * Original source file name.
         * @type {string}
         */
        this.filename = filename || "main";

        /**
         * The compiled meta program's source.
         * @type {string}
         */
        this.program = MetaScript.compile(source);
    };

    /**
     * Whether running under node.js or not.
     * @type {boolean}
     * @const
     */
    MetaScript.IS_NODE = typeof require === 'function' && typeof process !== 'undefined' && typeof process.nextTick === 'function';

    /**
     * Compiles the specified source to a meta program and returns its source.
     * @param {string} source Source
     * @returns {string} Meta program
     */
    MetaScript.compile = function(source) {
        source = source+"";

        var index = 0,                     // Current working index
            expr = /(\/\/\?|\/\*\?)(=?)/g, // Line/block expression
            exprLine = /\n|$/g,            // Line terminator
            exprBlock = /\*\//g,           // Block terminator
            exprEmpty = /(^|\n)([ \t]*)$/, // Empty line expression
            match, matchEnd,               // Matches
            s,                             // Temporary string
            indent = '',                   // Indentation
            lastIndent = '',               // Last indentation
            out = [],                      // Output stack
            empty;                         // Line empty?

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
            } else if (expr !== '') {
                return expr+'\n';
            } else return '';
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

                // Find the end of the line
                exprLine.lastIndex = match.index;
                matchEnd = exprLine.exec(source);

                // Expose indentation and evaluate expression
                if (indent !== lastIndent) {
                    out.push('__=\''+escapestr(lastIndent = indent)+'\';\n');
                }
                out.push(evaluate(source.substring(match.index+3, matchEnd.index).trim()));
                if (!empty || match[2] === '=')
                    out.push('writeln();\n');
                
                // Move on
                index = matchEnd.index+1;

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
     * Compiles the source to a meta program and transforms it using the specified scope. On node.js, this will wrap the
     *  entire process in a new VM context.
     * @param {string} source Source
     * @param {string=} filename Source file name
     * @param {!Object} scope Scope
     * @param {string=} basedir Base directory for includes, defaults to `.` on node and `/` in the browser
     * @returns {string} Transformed source
     */
    MetaScript.transform = function(source, filename, scope, basedir) {
        if (typeof filename === 'object') {
            basedir = scope;
            scope = filename;
            filename = undefined;
        }
        if (MetaScript.IS_NODE) {
            var vm = require("vm"),
                sandbox;
            vm.runInNewContext('__result = new MetaScript(__source, __filename).transform(__scope, __basedir);', sandbox = {
                __source   : source,
                __filename : filename,
                __scope    : scope,
                __basedir  : basedir,
                MetaScript : MetaScript
            });
            return sandbox.__result;
        } else {
            return new MetaScript(source, filename).transform(scope, basedir); // Will probably pollute the global namespace
        }
    };

    /**
     * Transforms the meta program.
     * @param {Object} scope Scope
     * @param {string=} basedir Base directory for includes, defaults to `.` on node and `/` in the browser
     * @returns {string} Transformed source
     */
    MetaScript.prototype.transform = function(scope, basedir) {
        basedir = basedir || (MetaScript.IS_NODE ? "." : "/");
        var vars = [];
        for (var k in (scope || {})) {
            if (scope.hasOwnProperty(k)) {
                vars.push(k+" = "+JSON.stringify(scope[k])+";\n");
            }
        }
        var __program = vars.join('')+this.program, // Meta program
            __out = [],                             // Output buffer
            __    = '';                             // Indentation

        ///////////////////////////////////////////// Built-in functions ///////////////////////////////////////////////
        
        /**
         * Writes some contents to the document (no indentation).
         * @function write
         * @param {*} s Contents to write
         */
        function write(s) {
            // Strip trailing white spaces on lines
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
         * Extracts the directory name from a file name.
         * @function dirname
         * @param {string} filename File name
         * @returns {string} Directory name, defaults to `.`
         */
        function dirname(filename) {
            var p = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\\\"));
            if (p >= 0) return filename.substring(0, p);
            return ".";
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
            filename = absolute ? filename : (basedir === '/' ? basedir : basedir + '/') + filename;
            var ____ = __;
            if (MetaScript.IS_NODE) {
                var files = require("glob").sync(filename);
                files.sort(naturalCompare); // Sort these naturally (e.g. int8 < int16)
                files.forEach(function(file) {
                    __eval(MetaScript.compile(indent(require("fs").readFileSync(file)+"", __)), file, filename);
                    __ = ____;
                });
            } else { // Pull it synchronously, FIXME: Is this working?
                var request = XHR();
                request.open('GET', filename, false);
                request.send(null);
                if (typeof request.responseText === 'string') { // status is 0 on local filesystem
                    __eval(MetaScript.compile(indent(request.responseText, __)), request.responseText, filename);
                    __ = ____;
                } else throw(new Error("Failed to fetch '"+filename+"': "+request.status));
            }
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
         * Evaluates a meta program.
         * @param {string} __program Meta program source
         * @param {string} __source Original source
         * @param {string} __filename Source file name
         * @inner
         * @private
         */
        function __eval(__program, __source, __filename) {
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
        
        __eval(__program, this.source, this.filename);
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
    
    /**
     * Constructs a XMLHttpRequest object.
     * @returns {!XMLHttpRequest}
     * @inner
     */
    function XHR() {
        var XMLHttpFactories = [
            function () {return new XMLHttpRequest()},
            function () {return new ActiveXObject("Msxml2.XMLHTTP")},
            function () {return new ActiveXObject("Msxml3.XMLHTTP")},
            function () {return new ActiveXObject("Microsoft.XMLHTTP")}
        ];
        var xhr = null;
        for (var i=0;i<XMLHttpFactories.length;i++) {
            try { xhr = XMLHttpFactories[i](); }
            catch (e) { continue; }
            break;
        }
        if (!xhr) throw(new Error("XMLHttpRequest is not supported"));
        return xhr;
    }

    // Enable module loading if available
    if (typeof module != 'undefined' && module["exports"]) { // CommonJS
        module["exports"] = MetaScript;
    } else if (typeof define != 'undefined' && define["amd"]) { // AMD
        define([], function() { return MetaScript; });
    } else { // Shim
        if (!global["dcodeIO"]) {
            global["dcodeIO"] = {};
        }
        global["dcodeIO"]["MetaScript"] = MetaScript;
    }

})(this);
