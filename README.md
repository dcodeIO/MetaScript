![MetaScript](https://raw.github.com/dcodeIO/MetaScript/master/MetaScript.png)
==============================================================================

**Metaprogramming** is the writing of computer programs that write or manipulate other programs (or themselves) as their
data, or that do part of the work at compile time that would otherwise be done at runtime.

**MetaScript** is a tool for build time meta programming using JavaScript as the meta language. Written between the
lines it enables developers to transform sources in pretty much every way possible.

<p align="center">
    <img src="https://raw.github.com/dcodeIO/MetaScript/master/example.jpg" />
</p>

[![Donate](https://raw.githubusercontent.com/dcodeIO/MetaScript/master/donate.png)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=info%40code-emitter.com&item_name=Open%20Source%3A%20MetaScript)

How does it work?
-----------------
If you already know JavaScript, adding some meta is as simple as remembering that:

* `//?` begins a line of meta.
* `/*?` begins a block of meta and `*/` ends it.
* `//?...` begins a snippet of meta and `//?.` ends it.
* `?=` writes the expression's raw result to the document.
* `?==` writes the expression's typed result to the document (runs it through `JSON.stringify`).

MetaScript then turns the meta inside out, making it the actual program, that outputs the contents in between.

A simple example
----------------
Let's assume that you have a library and that you want its version number to be included as the constant
`MyLibrary.VERSION`. With meta, this is as simple as:

```js
MyLibrary.VERSION = /*?== VERSION */;
// or, alternatively, if VERSION is always string-safe:
MyLibrary.VERSION = "/*?= VERSION */";
```

This is what the meta program, when compiled, will look like:

```js
  write('MyLibrary.VERSION = ');
write(JSON.stringify(VERSION));
  write(';\n');
```

Accordingly, a transformation of the source done by running that exact meta program with a scope of `{ VERSION: "1.0" }`
will result in:

```js
MyLibrary.VERSION = "1.0";
```

It's just that simple and everything else is, of course, up to your imagination.

Advanced examples
-----------------
Of course it's possible to do much more with it, like declaring macros and defining an entire set of useful utility
functions, just like with any sort of preprocessor:

#### That's a globally available utility function as a snippet:

```js
//?...
simpleIncludeExample = function(file) {
    write(indent(require("fs").readFileSync(file).toString("utf8")), __);
}
//?.
```

or, as a block:

```js
/*? simpleIncludeExample = function(file) {
    write(indent(require("fs").readFileSync(file).toString("utf8")), __);
} */
```

Using it:

```js
//? simpleIncludeExample("some/other/file.js")
```

This is, of course, just an example. See [built-in utility](https://github.com/dcodeIO/MetaScript#built-in-utility) for
what's actually available out of the box.

#### That's a globally available macro using inline blocks:

```js
//? ASSERT_OFFSET = function(varname) {
    if (/*?= varname */ < 0 || /*?= varname */ > this.capacity()) {
        throw RangeError("Illegal /*?= varname */");
    }
//? }
```

Using it:

```js
function writeInt8(value, offset) {
    //? ASSERT_OFFSET('offset');
    ...
}
```

Results in:

```js
function writeInt8(value, offset) {
    if (offset < 0 || offset > this.capacity()) {
        throw RangeError("Illegal offset");
    }
    ...
}
```

Some examples are available in the [tests folder](https://github.com/dcodeIO/MetaScript/tree/master/tests). While
these are JavaScript examples, MetaScript should fit nicely with any other programming language that uses `// ...` and
`/* ... */` style comments.

API
---
The API is pretty much straight forward:

* **new MetaScript(source:string, filename:string)**  
  Creates a new instance with `source`, located at `filename`, compiled to a meta program.
* **MetaScript#program**  
  Contains the meta program's source.
* **MetaScript#transform(scope:Object):string**  
  Runs the meta program in the current context, transforming the source depending on what's defined in `scope` and
  returns the final source.
  
One step compilation / transformation:

* **MetaScript.compile(source:string):string**  
  Compiles the specified source to a meta program and returns its source.
* **MetaScript.transform(source:string, filename:string, scope:Object):string**  
  Compiles `source`, located at `filename`, to a meta program and transforms it using the specified scope in a new VM
  context.

Command line
------------
Transforming sources on the fly is simple with node:

`npm install -g metascript`

```
 Usage: metascript sourcefile -SOMEDEFINE="some" -OTHERDEFINE="thing" [> outfile]
```

And in the case that you have to craft your own runtime, the raw compiler is also available as `metac`:

```
 Usage: metac sourcefile [> outfile]
```

Built-in utility
----------------
There are a few quite useful utility functions available to every meta program:

* **write(contents:string)**  
  Writes some raw data to the resulting document, which is equal to using `/*?= contents */`.
  
* **writeln(contents:string)**  
  Writes some raw data, followed by a line break, to the resulting document, which is equal to using `//?= __+contents`.
  
* **dirname(filename:string)**  
  Gets the directory name from a file name.
  
* **include(filename:string, absolute:boolean=)**  
  Includes another source file or multiple ones when using a glob expression. `absolute` defaults to `false` (relative)
  
* **indent(str:string, indent:string|number):string** indents a block of text using the specified indentation given
  either as a whitespace string or number of whitespaces to use.
  
* **escapestr(str:string):string**  
  Escapes a string to be used inside of a single or double quote enclosed JavaScript string.
  
* **snip()**  
  Begins a snipping operation at the current offset of the output.
  
* **snap():string**  
  Ends a snipping operation, returning the (suppressed) output between the two calls to `snip()` and `snap()`.
  
Additionally, there are [a few internal variables](https://github.com/dcodeIO/MetaScript/wiki#other-__-prefixed-variables).
Most notably there is the variable [__](https://github.com/dcodeIO/MetaScript/wiki#the-__-variable) (2x underscore) that
remembers the current indentation level. This is used for example to indent included sources exactly like the meta block
that contains the include call.

Using utility dependencies
--------------------------
In case this isn't obvious: Add the dependency to your package.json and, in MetaScript, use:
```js
//? myutility = require('metascript-myutility')
```

Usage as a task
---------------
* [Meinaart van Straalen](https://github.com/meinaart) created a Grunt task:
  [grunt-metascript](https://github.com/meinaart/grunt-metascript) ([npm](https://www.npmjs.org/package/grunt-metascript))
* [Wutian](https://github.com/Naituw) created a Broccoli task:
  [broccoli-metascript](https://github.com/Naituw/broccoli-metascript)

Documentation
-------------
* [Get additional insights at the wiki](https://github.com/dcodeIO/MetaScript/wiki)
* [View the API documentation](http://htmlpreview.github.io/?https://raw.githubusercontent.com/dcodeIO/MetaScript/master/docs/index.html)
* [View the tiny but fully commented source](https://github.com/dcodeIO/MetaScript/blob/master/MetaScript.js)

**License:** Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html
