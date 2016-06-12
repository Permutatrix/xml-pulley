# xml-pulley [![npm][npm-image]][npm-url] [![Dependency Status][david-image]][david-url] [![Build Status][travis-image]][travis-url]

This is a simple parser for XML&mdash;actually just a relatively thin wrapper
around [sax-js]. It's designed for and tested on [node], but it should work on
other CommonJS implementations, as well as browsers with the help of
bundlers like [Browserify].

The API is designed to work well with a variety of backends. This version uses
sax-js, but it ought to be easy enough to make a version using, for instance,
the built-in DOMParser in web browsers and drop it in with minimal changes to
the dependent code.

It's called "xml-pulley" because you _pull_ data from it, as opposed to SAX,
which _pushes_ data onto you, or DOM, which _stores_ data for you. And also
because I couldn't think of anything better to call it in the several seconds I
gave myself to think of a name.

There's no proper documentation at the moment. Have a look at [the 90 tests] if
you like; those were boring enough to write on their own. The wiki also has
[a simple example] of how xml-pulley might be used.


[travis-url]: https://travis-ci.org/Permutatrix/xml-pulley
[travis-image]: https://img.shields.io/travis/Permutatrix/xml-pulley/master.svg
[david-url]:   https://david-dm.org/Permutatrix/xml-pulley
[david-image]: https://img.shields.io/david/Permutatrix/xml-pulley/master.svg
[npm-url]: https://npmjs.org/package/xml-pulley
[npm-image]: https://img.shields.io/npm/v/xml-pulley.svg

[sax-js]: https://www.npmjs.com/package/sax
[node]: https://nodejs.org/
[Browserify]: http://browserify.org/
[the 90 tests]: https://github.com/Permutatrix/xml-pulley/blob/master/test/test.js
[a simple example]: https://github.com/Permutatrix/xml-pulley/wiki/Example
