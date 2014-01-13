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
     * Compiles the specified source to a meta program.
     * @param {string} source Source
     * @returns {string} Meta program
     */
    MetaScript.compile = function(source) {
        source = source+"";

        var index = 0,                 // Current working index
            expr = /(\/\/\?|\/\*\?)/g, // Line/block expression
            exprLine = /\n|$/g,        // Line terminator
            exprBlock = /\*\//g,       // Block terminator
            match, matchEnd,           // Matches
            s,                         // Temporary string
            indent,                    // Indentation
            out = [];                  // Output stack

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

        // Appends additional content to the program
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
            if (match[1] === '/'+'/?') { // Line

                // Trim whitespaces in front of the line
                s = s.replace(/\n([ \t]+)$/, function($0, $1) { indent = $1; return '\n'; });

                // Append leading contents if not empty
                if (s !== '') append(s);

                // Find the end of the line
                exprLine.lastIndex = match.index;
                matchEnd = exprLine.exec(source);

                // Evaluate expression
                out.push(evaluate(source.substring(match.index+3, matchEnd.index).trim()));

                // Move on
                index = matchEnd.index+1;

            } else { // Block

                // Trim whitespaces in front of the block if it is using a dedicated line
                s = s.replace(/\n([ \t]+)$/, function($0, $1) { indent = $1; return '\n'; });

                // Append leading contents if not empty
                if (s !== '') append(s);

                // Find the end of the block
                exprBlock.lastIndex = match.index;
                if (matchEnd = exprBlock.exec(source)) {

                    // Evaluate expression
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

        // Append the remaining contents if not empty
        s = source.substring(index);
        if (s !== '') append(s);

        // And return the program
        return out.join('');
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
                vars.push("var "+k+" = "+JSON.stringify(scope[k])+";\n");
            }
        }
        var out = [];

        ///////////////////////////////////////////// Built-in functions ///////////////////////////////////////////////

        /**
         * Writes some contents to the document.
         * @param {*} s Contents to write
         */
        function write(s) {
            out.push(s+"");
        }

        /**
         * Writes some contents to the document, followed by a new line.
         * @param {*} s Contents to write
         */
        function writeln(s) {
            out.push(s+"\n");
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
         * Defines a variable on the scope.
         * @param {string} varname Variable name
         * @param {*} value Value
         */
        function define(varname, value) {
            scope[varname] = value;
            return value; // For one-line local assignments
        }

        /**
         * Deletes a previously defined variable from the scope.
         * @param {string} varname Variable name
         */
        function undefine(varname) {
            delete scope[varname];
        }

        /**
         * Includes another source file.
         * @param {string} filename File to include
         * @param {boolean} absolute Whether the path is absolute, defaults to `false` for a relative path
         */
        function include(filename, absolute) {
            filename = absolute ? filename : (basedir === '/' ? basedir : basedir + '/') + filename;
            var source;
            if (MetaScript.IS_NODE) {
                source = require("fs").readFileSync(filename)+"";
            } else { // Pull it synchronously, FIXME: Is this working?
                var request = XHR();
                request.open('GET', filename, false);
                request.send(null);
                if (typeof request.responseText === 'string') { // status is 0 on local filesystem
                    source = request.responseText;
                } else throw(new Error("Failed to fetch '"+filename+"': "+request.status));
            }
            write(new MetaScript(source).transform(scope, dirname(filename)));
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        eval('(function(){'+vars.join('')+this.program+'})()'); // This is, of course, potentially evil as it is capable
        // of polluting the global namespace if variables have been declared carelessly. Always use `var something = ..`
        // for local (to the file) variables and `define('varname', ...)` for global ones.

        return out.join('');
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
