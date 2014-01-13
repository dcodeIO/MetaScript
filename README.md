MetaScript
==========

**Metaprogramming** is the writing of computer programs that write or manipulate other programs (or themselves) as their
data, or that do part of the work at compile time that would otherwise be done at runtime. In some cases, this allows
programmers to minimize the number of lines of code to express a solution (hence reducing development time), or it gives
programs greater flexibility to efficiently handle new situations without recompilation.

**MetaScript** is build-time meta programming in JavaScript.

How does it work?
-----------------
If you already know JavaScript, adding some meta is as simple as remembering, that ...

* A line of meta begins with `//?`
* A block of meta is enclosed in `/*?`  and `*/`
* `?=` writes the expression's raw result to the document
* `?==` writes the expression's typed result to the document (runs it through `JSON.stringify`)

A simple example
----------------
Let's assume that you have a library and that you want its version number to be included as the constant
`MyLibrary.VERSION`. With meta, this is as simple as:

```js
MyLibary.VERSION = /*?== VERSION */;
```

This is what the meta program, when compiled, will look like:

```js
  write('MyLibrary.VERSION = ');
write(JSON.stringify(VERSION));
  write(';\r\n');
```

Accordingly, a transformation of that exact meta program with a scope of `{ VERSION: "1.0" }` will result in:

```js
MyLibrary.VERSION = "1.0";
```

It's just that simple.

Advanced example
----------------
Of course it's possible to do much more with it, like declaring macros and defining an entire set of useful utility
functions.

#### That's a utility function:

```js
/*? function includeFile(file) {
    write(require("fs").readFileSync(file));
} */
```

Using it:

```js
//? includeFile("some/other/file.js")
```

#### That's a macro:

```js
//? function assertOffset(varname) {
    if (/*?= varname */ < 0 || /*?= varname */ > this.capacity()) {
        throw(new RangeError("Illegal /*?= varname */"));
    }
//? }
```

Using it:

```js
ByteBuffer.prototype.writeInt8(value, offset) {
    //? assertOffset('offset');
    ...
}
```

Inbuilt utility functions
-------------------------
There are a few quite useful utility functions available:

* **write(contents:string)**
  Writes some raw data to the resulting document
* **dirname(filename:string)**
  Gets the directory name from a file name
* **define(varname:string, value:*)**
  Defines a variable on the scope which is then also available to includes
* **include(filename:string, absolute:boolean=)**
  Includes another source file. `absolute` defaults to `false` (relative)

Everything else is up to your imagination.

**License:** Apache License, Version 2.0
