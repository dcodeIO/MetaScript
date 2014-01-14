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
    // not strict
    
    // This is a rather small program with lots of comments, so everyone can hack it easily.

    /**
     * Constructs a new MetaScript instance.
     * @param {string=} source Source to compile
     * @constructor
     */
    var MetaScript = function(source) {

        /**
         * Meta program.
         * @type {?string}
         */
        this.program = typeof source !== 'undefined' ? MetaScript.compile(source) : null;
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
            match, matchEnd,               // Matches
            s,                             // Temporary string
            indent = '',                   // Indentation
            lastIndent = '',               // Last indentation
            out = [];                      // Output stack

        // Escapes a string to be used in a JavaScript string enclosed in single quotes
        function escape(s) {
            return s.replace(/'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
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
                if (s !== '') out.push('  write(\''+escape(s)+'\');\n');
                index = match.index+1;
            }
            s = source.substring(index, source.length);
            if (s !== '') out.push('  write(\''+escape(s)+'\');\n');
        }

        // Turn the meta inside out:
        while (match = expr.exec(source)) {

            // Get leading contents
            s = source.substring(index, match.index);

            // Look if it is a line or a block of meta
            if (match[1].indexOf('*') < 0) { // Line

                // Trim whitespaces in front of the line and remember the indentation
                if (match[2] !== '=')
                    s = s.replace(/(^|\n)([ \t]*)$/, function($0, $1, $2) { indent = $2; return $1; });
                
                // Append leading contents
                append(s);

                // Find the end of the line
                exprLine.lastIndex = match.index;
                matchEnd = exprLine.exec(source);

                // Expose indentation and evaluate expression
                if (indent !== lastIndent) {
                    out.push('__=\''+escape(lastIndent = indent)+'\';\n');
                }
                out.push(evaluate(source.substring(match.index+3, matchEnd.index).trim()));
                if (match[2] === '=')
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
                        out.push('__=\''+escape(lastIndent = indent)+'\';\n');
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
     * @param {Object} scope Scope
     * @param {string=} basedir Base directory for includes, defaults to `.` on node and `/` in the browser
     * @returns {string} Transformed source
     */
    MetaScript.transform = function(source, scope, basedir) {
        if (MetaScript.IS_NODE) {
            var sandbox;
            require("vm").runInNewContext('__result = new MetaScript(__source).transform(__scope, __basedir);', sandbox = {
                __source: source,
                __scope: scope,
                __basedir: basedir,
                MetaScript: MetaScript
            });
            return sandbox.__result;
        } else {
            return new MetaScript(source).transform(scope, basedir);
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
        var __out = [],     // Output buffer
            __    = '';     // Indentation

        ///////////////////////////////////////////// Built-in functions ///////////////////////////////////////////////
        
        /**
         * Writes some contents to the document (no indentation).
         * @param {*} s Contents to write
         */
        function write(s) {
            __out.push(s+"");
        }

        /**
         * Writes some contents to the document, followed by a new line.
         * @param {*} s Contents to write
         */
        function writeln(s) {
            if (typeof s === 'undefined') s = '';
            write(s+"\n");
        }

        /**
         * Extracts the directory name from a file name.
         * @param {string} filename File name
         * @returns {string} Directory name, defaults to `.`
         */
        function dirname(filename) {
            var p = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\\\"));
            if (p >= 0) return filename.substring(0, p);
            return ".";
        }

        /**
         * Intents a block of text.
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
         * @param {string} __filename File to include
         * @param {boolean} __absolute Whether the path is absolute, defaults to `false` for a relative path
         */
        function include(__filename, __absolute) {
            __filename = __absolute ? __filename : (basedir === '/' ? basedir : basedir + '/') + __filename;
            var __source;
            if (MetaScript.IS_NODE) {
                var files = require("glob").sync(__filename);
                __source = "";
                files.forEach(function(file, i) {
                    if (__source !== '') // Add line break between includes
                        __source += __source.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
                    __source += require("fs").readFileSync(file)+"";
                });
            } else { // Pull it synchronously, FIXME: Is this working?
                var request = XHR();
                request.open('GET', filename, false);
                request.send(null);
                if (typeof request.responseText === 'string') { // status is 0 on local filesystem
                    __source = request.responseText;
                } else throw(new Error("Failed to fetch '"+filename+"': "+request.status));
            }
            try {
                __source = MetaScript.compile(__source);
                eval(__source);
            } catch (err) {
                if (err.rethrow) throw(err);
                err = new Error(err.message+" in included meta program of '"+__filename+"':\n"+indent(__source, 4));
                err.rethrow = true;
                throw(err);
            }
        }

        /**
         * Escaoes a string to be used inside of a single or double quote enclosed JavaScript string.
         * @param {string} s String to escape
         * @returns {string} Escaped string
         */
        function escapestr(s) {
            return s.replace(/'/g, '\\\'')
                    .replace(/"/g, '\\"')
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n');
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        try {
            eval(vars.join('')+this.program); // This is, of course, potentially evil as it is capable of polluting the
            // global namespace if global variables have been declared carelessly. There is no way around, though.
            return __out.join('');
        } catch (err) {
            if (err.rethrow) throw(err);
            err = new Error(err.message+" in main meta program:\n"+indent(vars.join('')+this.program, 4));
            err.rethrow = true;
            throw(err);
        }
    };

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
        define(function() { return MetaScript; });
    } else { // Shim
        if (!global["dcodeIO"]) {
            global["dcodeIO"] = {};
        }
        global["dcodeIO"]["MetaScript"] = MetaScript;
    }

})(this);
