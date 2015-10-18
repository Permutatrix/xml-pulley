# xml-pulley [![Build Status][travis-image]][travis-url]
This is a simple parser for XML&mdash;actually just a relatively thin wrapper
around [sax-js](https://www.npmjs.com/package/sax). It's designed for and tested
on [node](https://nodejs.org/), but it should work on other CommonJS
implementations, as well as browsers with the help of
[Browserify](http://browserify.org/).

The API is designed to work well with a variety of backends. This version uses
sax-js, but it ought to be easy enough to make a version using, for instance,
the built-in DOMParser in web browsers and drop it in with minimal changes to
the dependent code.

It's called "xml-pulley" because you _pull_ data from it, as opposed to SAX,
which _pushes_ data onto you, or DOM, which _stores_ data for you. And also
because I couldn't think of anything better to call it in the several seconds I
gave myself to think of a name.

## Example
### XML
```xml
<root>
  <dict>
    <entry name="ha1">Ha</entry>
    <entry name="ha2"> ha</entry>
  </dict>
  <dict>
    <entry name="stop">.</entry>
  </dict>
  <item>ha1</item>
  <item>ha2</item>
  <item>ha2</item>
  <item>stop</item>
</root>
```
### JavaScript
```js
var xmlPulley = require('xml-pulley');
var makePulley = xmlPulley.makePulley;

var dict = {}, out = '';
function parseRoot(pulley) {
  pulley.expectName('root');
  pulley.loop(function(pulley) {
    if(pulley.check('opentag').name !== 'dict')
      return true;
    parseDict(pulley);
  });
  pulley.loop(function(pulley) {
    pulley.checkName('item');
    parseItem(pulley);
  });
  pulley.expectName('root', 'closetag');
}
function parseDict(pulley) {
  pulley.loopTag(parseEntry, 'dict');
}
function parseEntry(pulley) {
  var tag = pulley.expectName('entry');
  dict[tag.attributes.name] = pulley.expect('text').rawText;
  pulley.expectName('entry', 'closetag');
}
function parseItem(pulley) {
  pulley.expectName('item');
  out += dict[pulley.expect('text').text];
  pulley.expectName('item', 'closetag');
}

var pulley = makePulley(xmlString, {
  skipWhitespaceOnly: true,
  trim: true,
  normalize: true
});
parseRoot(pulley);
console.log(out);
```
### Output
```text
Ha ha ha.
```


[travis-url]: https://travis-ci.org/Permutatrix/xml-pulley
[travis-image]: https://travis-ci.org/Permutatrix/xml-pulley.svg
