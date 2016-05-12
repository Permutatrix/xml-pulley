var expect = require('chai').expect;
var xmlPulley = require('../lib/xml-pulley.js');
var makePulley = xmlPulley.makePulley;


describe("makePulley()", function() {
  it("should throw when passed an invalid type", function() {
    expect(function() { makePulley('', {types: ['text', 'error']}) }).to.throw();
  });
  
  it("should not throw when passed only valid types", function() {
    expect(function() { makePulley('', {types: ['text', 'opentag']}) }).to.not.throw();
  });
  
  it("should throw when given invalid XML", function() {
    expect(function() { makePulley('</invalid>'); }).to.throw();
  });
});

describe("assertName()", function() {
  it("should throw when passed a tag with the wrong name", function() {
    var pulley = makePulley('<root/>');
    expect(function() {
      xmlPulley.assertName(pulley.next(), 'not-root');
    }).to.throw();
  });
  
  it("should not throw when passed a tag with the right name", function() {
    var pulley = makePulley('<root/>');
    expect(function() {
      xmlPulley.assertName(pulley.next(), 'root');
    }).to.not.throw();
  });
  
  it("should throw the passed-in error", function() {
    var pulley = makePulley('<root/>');
    var error = new Error('test error');
    expect(function() {
      xmlPulley.assertName(pulley.next(), 'not-root', error);
    }).to.throw(error);
  });
});

describe("assertType()", function() {
  it("should throw when passed a tag with the wrong type", function() {
    var pulley = makePulley('<root/>');
    expect(function() {
      xmlPulley.assertType(pulley.next(), 'closetag');
    }).to.throw();
  });
  
  it("should throw when passed undefined", function() {
    expect(function() {
      xmlPulley.assertType(undefined, 'closetag');
    }).to.throw();
  });
  
  it("should not throw when passed a tag with the right type", function() {
    var pulley = makePulley('<root/>');
    expect(function() {
      xmlPulley.assertType(pulley.next(), 'opentag');
    }).to.not.throw();
  });
  
  it("should throw the passed-in error", function() {
    var pulley = makePulley('<root/>');
    var error = new Error('test error');
    expect(function() {
      xmlPulley.assertType(pulley.next(), 'closetag', error);
    }).to.throw(error);
  });
});

describe("XMLPulley", function() {
  describe(".next()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = makePulley('');
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should probably work, that might be important down the line", function() {
      var pulley = makePulley('<root>A <tag attr="value">tag. <tag>And another.</tag></tag> Nice.</root>');
      expect(pulley.expect('opentag')).to.have.property('name', 'root');
      expect(pulley.expect('text')).to.have.property('text', 'A ');
      var tag = pulley.expect('opentag');
      expect(tag).to.have.property('name', 'tag');
      expect(tag).to.have.deep.property('attributes.attr', 'value');
      expect(pulley.expect('text')).to.have.property('text', 'tag. ');
      expect(pulley.expect('opentag')).to.have.property('name', 'tag');
      expect(pulley.expect('text')).to.have.property('text', 'And another.');
      expect(pulley.expect('closetag')).to.have.property('name', 'tag');
      expect(pulley.expect('closetag')).to.have.property('name', 'tag');
      expect(pulley.expect('text')).to.have.property('text', ' Nice.');
      expect(pulley.expect('closetag')).to.have.property('name', 'root');
      expect(pulley.next()).to.be.undefined;
    });
  });
  
  describe(".peek()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = makePulley('');
      expect(pulley.peek()).to.be.undefined;
    });
    
    it("should return the same value as next()", function() {
      var pulley = makePulley('<root attr="val"/>');
      expect(pulley.peek()).to.equal(pulley.next());
    });
    
    it("should return the same value on consecutive calls", function() {
      var pulley = makePulley('<root/>');
      expect(pulley.peek()).to.equal(pulley.peek());
    });
  });
  
  describe(".nextText()", function() {
    it("should return the current block of text if there is one", function() {
      var pulley = makePulley('<text>\n  Text.\n</text>', {trim: true, normalize: true});
      pulley.expectName('text');
      expect(pulley.peek()).to.deep.equal(pulley.nextText());
    });
    
    it("should provide whitespace-only text even if it's configured to skip", function() {
      var pulley = makePulley('<text>\n</text>', {skipWhitespaceOnly: true});
      pulley.expectName('text');
      expect(pulley.nextText()).to.have.property('text', '\n');
    });
    
    it("should return an empty text node when there's no text to read", function() {
      var pulley = makePulley('<notext></notext>');
      pulley.expectName('notext');
      expect(pulley.nextText()).to.have.property('rawText', '');
    });
    
    it("should return an empty text node when there's no more data", function() {
      var pulley = makePulley('');
      expect(pulley.nextText()).to.have.property('rawText', '');
    });
  });
  
  describe(".peekText()", function() {
    it("should return the current block of text if there is one", function() {
      var pulley = makePulley('<text>\n  Text.\n</text>', {trim: true, normalize: true});
      pulley.expectName('text');
      expect(pulley.peek()).to.deep.equal(pulley.peekText());
    });
    
    it("should provide whitespace-only text even if it's configured to skip", function() {
      var pulley = makePulley('<text>\n</text>', {skipWhitespaceOnly: true});
      pulley.expectName('text');
      expect(pulley.peekText()).to.have.property('text', '\n');
    });
    
    it("should return an empty text node when there's no text to read", function() {
      var pulley = makePulley('<notext></notext>');
      pulley.expectName('notext');
      expect(pulley.peekText()).to.have.property('rawText', '');
    });
    
    it("should return an empty text node when there's no more data", function() {
      var pulley = makePulley('');
      expect(pulley.peekText()).to.have.property('rawText', '');
    });
    
    it("should return an equivalent value to nextText()", function() {
      var pulley1 = makePulley('<root>\n  Text.\n</root>', {trim: true, normalize: true});
      var pulley2 = makePulley('<root>\n  Text.\n</root>', {trim: true, normalize: true});
      pulley1.expectName('root'); pulley2.expectName('root');
      expect(pulley1.peekText()).to.deep.equal(pulley2.nextText());
    });
    
    it("should return equivalent values on consecutive calls", function() {
      var pulley = makePulley('<root>\n  Text.\n</root>', {trim: true, normalize: true});
      pulley.expectName('root');
      expect(pulley.peekText()).to.deep.equal(pulley.peekText());
    });
  });
  
  describe(".expect()", function() {
    it("should throw when the next node isn't of the specified type", function() {
      var pulley = makePulley('<root/>');
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should throw when there's no more data", function() {
      var pulley = makePulley('');
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should return the same as next() on success", function() {
      var pulley1 = makePulley('<root attr="val"/>');
      var pulley2 = makePulley('<root attr="val"/>');
      expect(pulley1.expect('opentag')).to.deep.equal(pulley2.next());
    });
    
    it("should move up the queue on success", function() {
      var pulley = makePulley('<root/>');
      pulley.expect('opentag');
      pulley.expect('closetag');
    });
    
    it("should leave the queue untouched on failure", function() {
      var pulley = makePulley('<root/>');
      expect(function() { pulley.expect('closetag'); }).to.throw();
      pulley.expect('opentag');
    });
  });
  
  describe(".expectName()", function() {
    it("should throw when the next node isn't of the specified type", function() {
      var pulley = makePulley('<root><tag/></root>');
      pulley.expect('opentag');
      expect(function() { pulley.expectName('tag', 'closetag'); }).to.throw();
    });
    
    it("should throw when the next node doesn't have the specified name", function() {
      var pulley = makePulley('<root>text</root>');
      expect(function() { pulley.expectName('not-root'); }).to.throw();
    });
    
    it("should throw when there's no more data", function() {
      var pulley = makePulley('');
      expect(function() { pulley.expectName('tag'); }).to.throw();
    });
    
    it("should return the same as next() on success", function() {
      var pulley1 = makePulley('<root attr="val"/>');
      var pulley2 = makePulley('<root attr="val"/>');
      expect(pulley1.expectName('root')).to.deep.equal(pulley2.next());
    });
    
    it("should move up the queue on success", function() {
      var pulley = makePulley('<root/>');
      pulley.expectName('root');
      pulley.expect('closetag');
    });
    
    it("should leave the queue untouched on failure", function() {
      var pulley = makePulley('<root/>');
      expect(function() { pulley.expectName('tag'); }).to.throw();
      pulley.expect('opentag');
    });
  });
  
  describe(".loop()", function() {
    // oh god loop() is so complicated and I hate writing tests :(((
    it("should repeat until it finds a node of the given endType", function() {
      var pulley = makePulley('<root><a/><b/>c<d/></root>');
      var expected = ['root', 'a', 'a', 'b', 'b'];
      pulley.loop(function(pulley) {
        expect(pulley.next()).to.have.property('name', expected.shift());
      }, 'text');
      expect(expected).to.be.empty;
      expect(pulley.expect('text')).to.have.property('text', 'c');
    });
    
    it("should set endType to 'closetag' by default", function() {
      var pulley = makePulley('<root><a/><b/>c<d/></root>');
      var expected = ['root', 'a'];
      pulley.loop(function(pulley) {
        expect(pulley.next()).to.have.property('name', expected.shift());
      });
      expect(expected).to.be.empty;
      pulley.expectName('a', 'closetag');
    });
    
    it("should go up to the end of the file if no node of type endType is found", function() {
      var pulley = makePulley('<root>text</root>');
      pulley.expect('opentag');
      var expected = ['text', 'text', 'name', 'root'];
      pulley.loop(function(pulley) {
        expect(pulley.next()).to.have.property(expected.shift(), expected.shift());
      }, 'opentag');
      expect(expected).to.be.empty;
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should let the user decide the size of a unit", function() {
      var pulley = makePulley('<root><a/><b/><c/></root>');
      pulley.expect('opentag');
      var expected = ['a', 'b', 'c'];
      pulley.loop(function(pulley) {
        var next = expected.shift();
        pulley.expectName(next);
        pulley.expectName(next, 'closetag');
      });
      expect(expected).to.be.empty;
      pulley.expectName('root', 'closetag');
    });
    
    it("should work properly when nested", function() {
      var pulley = makePulley('<root><a><b/></a><b><a/><b/></b></root>');
      pulley.expect('opentag');
      var expected = ['a', ['b'], 'b', ['a', 'b']];
      pulley.loop(function(pulley) {
        var next = expected.shift();
        pulley.expectName(next);
        var items = expected.shift();
        pulley.loop(function(pulley) {
          var next = items.shift();
          pulley.expectName(next);
          pulley.expectName(next, 'closetag');
        });
        expect(items).to.be.empty;
        pulley.expectName(next, 'closetag');
      });
      expect(expected).to.be.empty;
      pulley.expectName('root', 'closetag');
    });
    
    it("should break out of the loop if the callback returns a truthy value", function() {
      var pulley = makePulley('<root><a/><c/><b/></root>');
      pulley.expect('opentag');
      pulley.loop(function(pulley) {
        var tag = pulley.expect('opentag').name;
        if(tag === 'b') return 1;
        pulley.expectName(tag, 'closetag');
      });
      pulley.expectName('b', 'closetag');
    });
  });
  
  describe(".loopTag()", function() {
    it("should consume the entire contents of the tag", function() {
      var pulley = makePulley('<root>text <!--comment--> text</root>', {types: ['opentag', 'closetag', 'text', 'comment']});
      var expected = ['text ', 'comment', ' text'];
      pulley.loopTag(function(pulley) {
        expect(pulley.next()).to.have.property('text', expected.shift());
      });
      expect(expected).to.be.empty;
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should throw if it finds a closetag with the wrong name", function() {
      var pulley = makePulley('<root><a/></root>');
      expect(function() {
        pulley.loopTag(function(pulley) {
          pulley.next();
        });
      }).to.throw();
      pulley.expectName('a', 'closetag');
    });
    
    it("should throw if it hits the end of the file with no closetag", function() {
      var pulley = makePulley('<root><a/></root>');
      expect(function() {
        pulley.loopTag(function(pulley) {
          for(var i = 0; i < 10; ++i) pulley.next();
        });
      }).to.throw();
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should throw if the cursor isn't on an opentag", function() {
      var pulley = makePulley('<!-- --><root></root>', {types: ['opentag', 'closetag', 'comment']});
      expect(function() {
        pulley.loopTag(function(pulley) {
          pulley.next();
        });
      }).to.throw();
      pulley.expect('comment');
    });
    
    it("should throw when passed a tag name different from the cursor's", function() {
      var pulley = makePulley('<root></root>', {types: ['opentag', 'closetag', 'comment']});
      expect(function() {
        pulley.loopTag(function(pulley) {
          pulley.next();
        }, 'not-root');
      }).to.throw();
      pulley.expectName('root');
    });
    
    it("should let the user decide the size of a unit", function() {
      var pulley = makePulley('<root><a/><b/><c/></root>');
      var expected = ['a', 'b', 'c'];
      pulley.loopTag(function(pulley) {
        var next = expected.shift();
        pulley.expectName(next);
        pulley.expectName(next, 'closetag');
      });
      expect(expected).to.be.empty;
    });
    
    it("should work properly when nested", function() {
      var pulley = makePulley('<root><a><b/></a><b><a/><b/></b></root>');
      var expected = ['a', ['b'], 'b', ['a', 'b']];
      pulley.loopTag(function(pulley) {
        var next = expected.shift();
        var items = expected.shift();
        pulley.loopTag(function(pulley) {
          var next = items.shift();
          pulley.expectName(next);
          pulley.expectName(next, 'closetag');
        }, next);
        expect(items).to.be.empty;
      });
      expect(expected).to.be.empty;
    });
    
    it("should pass the opentag into the callback every time", function() {
      var pulley = makePulley('<root>text <a/></root>');
      var opentag = pulley.peek();
      pulley.loopTag(function(pulley, tag) {
        expect(tag).to.equal(opentag);
        if(pulley.next().type === 'opentag') pulley.expect('closetag');
      });
    });
    
    it("should return the opentag", function() {
      var pulley = makePulley('<root></root>');
      var opentag = pulley.peek();
      expect(pulley.loopTag(function(pulley, tag) {
        pulley.next();
      })).to.equal(opentag);
    });
  });
  
  describe(".skipTag()", function() {
    it("should consume the entire contents of the tag", function() {
      var pulley = makePulley('<root><a>text <b/> <b><a/>text</b></a></root>');
      pulley.expectName('root');
      pulley.skipTag();
      pulley.expectName('root', 'closetag');
    });
    
    it("should throw if it hits the end of the file with no closetag", function() {
      var pulley = makePulley('<root></root>', {types: ['opentag']});
      expect(function() {
        pulley.skipTag();
      }).to.throw();
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should throw if the cursor isn't on an opentag", function() {
      var pulley = makePulley('<!-- --><root></root>', {types: ['opentag', 'closetag', 'comment']});
      expect(function() {
        pulley.skipTag();
      }).to.throw();
      pulley.expect('comment');
    });
    
    it("should throw when passed a tag name different from the cursor's", function() {
      var pulley = makePulley('<root></root>', {types: ['opentag', 'closetag', 'comment']});
      expect(function() {
        pulley.skipTag('not-root');
      }).to.throw();
      pulley.expectName('root');
    });
    
    it("should return the opentag of the tag it skipped", function() {
      var pulley = makePulley('<root></root>');
      var opentag = pulley.peek();
      expect(pulley.skipTag()).to.equal(opentag);
    });
  });
  
  describe(".checkin()", function() {
    it("should return a new pulley with its cursor on the same node", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      expect(pulley1.peek()).to.equal(pulley2.peek());
    });
    
    it("should return a pulley that can be used without affecting the original", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      expect(pulley2.next()).to.equal(pulley1.peek());
    });
    
    it("should work on pulleys that are already checked-in", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      pulley2.expectName('root');
      var pulley3 = pulley2.checkin();
      expect(pulley3.next()).to.equal(pulley2.peek());
    });
  });
  
  describe(".checkout()", function() {
    it("should throw when called on a pulley that wasn't checked in", function() {
      var pulley = makePulley('<root/>');
      expect(function() { pulley.checkout(); }).to.throw();
    });
    
    it("should move the original pulley's cursor to that of the checked-in one", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      pulley2.expectName('root');
      pulley2.checkout();
      pulley1.expectName('root', 'closetag');
    });
    
    it("should leave the checked-in pulley's cursor at the end of the file", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      pulley2.checkout();
      expect(pulley2.peek()).to.be.undefined;
    });
    
    it("should return the original pulley", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      expect(pulley2.checkout()).to.equal(pulley1);
    });
    
    it("should move up only one level in a chain of check-ins", function() {
      var pulley1 = makePulley('<root/>'), pulley2 = pulley1.checkin();
      pulley2.expectName('root');
      var pulley3 = pulley2.checkin();
      pulley3.expectName('root', 'closetag');
      pulley3.checkout();
      expect(pulley2.peek()).to.be.undefined;
      pulley1.expectName('root');
    });
  });
});

describe("Behavior", function() {
  describe("Collapsing text", function() {
    it("should collapse text and CDATA into a single text node", function() {
      var pulley = makePulley('<mlp>Pinkie Pie<![CDATA[ > oth]]>er ponies</mlp>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'Pinkie Pie > other ponies');
    });
    
    it("should collapse text across boundaries of unmatched types", function() {
      var pulley = makePulley('<dhsb><bad-horse>Bad Horse,</bad-horse> Bad Horse!</dhsb>', {types: ['text']});
      expect(pulley.expect('text')).to.have.property('text', 'Bad Horse, Bad Horse!');
    });
  });
  
  describe("Trimming", function() {
    it("should trim text when given options.trim", function() {
      var pulley = makePulley('<root>\n  Look at me with my fancy indentation\n</root>', {trim: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'Look at me with my fancy indentation');
    });
    
    it("should not trim text by default", function() {
      var pulley = makePulley('<root>   This part of XML is super annoying.\n</root>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '   This part of XML is super annoying.\n');
    });
    
    it("should not skip whitespace-only nodes when given only options.trim", function() {
      var pulley = makePulley('<root>\n</root>', {trim: true});
      pulley.expect('opentag');
      pulley.expect('text');
    });
    
    it("should not trim CDATA", function() {
      var pulley = makePulley('<root><![CDATA[   ]]></root>', {trim: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '   ');
    });
  });
  
  describe("Skipping whitespace-only nodes", function() {
    it("should skip whitespace-only nodes when given options.skipWhitespaceOnly", function() {
      var pulley = makePulley('<root>\n</root>', {skipWhitespaceOnly: true});
      pulley.expect('opentag');
      pulley.expect('closetag');
    });
    
    it("should not skip whitespace-only nodes by default", function() {
      var pulley = makePulley('<root>\n</root>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '\n');
    });
    
    it("should not skip non-whitespace text nodes", function() {
      var pulley = makePulley('<root>  Text  </root>', {skipWhitespaceOnly: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '  Text  ');
    });
  });
  
  describe("Normalization", function() {
    it("should collapse whitespace when given options.normalize", function() {
      var pulley = makePulley('<sbahj>I WARNED YOU ABOUT STAIRS BRO!!!!\n\n\nI TOLD YOU DOG!</sbahj>', {normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'I WARNED YOU ABOUT STAIRS BRO!!!! I TOLD YOU DOG!');
    });
    
    it("should not collapse whitespace by default", function() {
      var pulley = makePulley('<sbahj>I TOLD YOU MAN\n\nI TOLD YOU ABOUT STAIRS!</sbahj>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'I TOLD YOU MAN\n\nI TOLD YOU ABOUT STAIRS!');
    });
    
    it("should not normalize CDATA", function() {
      var pulley = makePulley('<root><![CDATA[\n data  ]]></root>', {normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '\n data  ');
    });
  });
  
  describe("rawText", function() {
    it("should provide unmodified raw text when trimming and normalizing", function() {
      var pulley = makePulley('<root>\n  Writing   tests   is boring.\n</root>', {trim: true, normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('rawText', '\n  Writing   tests   is boring.\n');
    });
    
    it("should be equal to text when trimming and normalizing are disabled", function() {
      var pulley = makePulley('<root>\n  Writing   tests   is still boring.\n</root>');
      pulley.expect('opentag');
      var text = pulley.expect('text');
      expect(text.text).to.equal(text.rawText);
    });
    
    it("should apply to comments, as well", function() {
      var pulley = makePulley('<!--\n  This is\n  a comment.\n-->', {trim: true, normalize: true, types: ['comment']});
      expect(pulley.expect('comment')).to.have.property('rawText', '\n  This is\n  a comment.\n');
    });
  });
  
  describe("Namespaces", function() {
    it("should provide namespace info when given options.xmlns", function() {
      var pulley = makePulley('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {xmlns: true});
      expect(pulley.expect('opentag')).to.have.property('ns');
    });
    
    it("should not provide namespace info by default", function() {
      var pulley = makePulley('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      expect(pulley.expect('opentag')).to.not.have.property('ns');
    });
  });
  
  describe("Event types", function() {
    it("should handle opentagstart and attribute", function() {
      var pulley = makePulley('<root><tag a="value" b="data"/></root>', {types: ['opentagstart', 'opentag', 'attribute', 'closetag']});
      expect(pulley.expect('opentagstart')).to.have.property('name', 'root');
      expect(pulley.expect('opentag')).to.have.property('name', 'root');
      var tagstart = pulley.expect('opentagstart');
      expect(tagstart).to.have.property('name', 'tag');
      expect(tagstart).to.have.property('attributes').that.deep.equals({});
      var a = pulley.expect('attribute');
      expect(a).to.have.property('name', 'a');
      expect(a).to.have.property('value', 'value');
      var b = pulley.expect('attribute');
      expect(b).to.have.property('name', 'b');
      expect(b).to.have.property('value', 'data');
      var tag = pulley.expect('opentag');
      expect(tag).to.have.property('name', 'tag');
      expect(tag).to.have.property('attributes').that.deep.equals({ a: 'value', b: 'data' });
    });
    
    it("should handle opennamespace and closenamespace", function() {
      var pulley = makePulley('<root xmlns:foo="http://example.com/a">A<tag xmlns:foo="http://example.com/b" xmlns:bar="http://example.com/a">B</tag>C</root>', {types: ['opennamespace', 'text', 'closenamespace'], xmlns: true});
      expect(pulley.expect('opennamespace')).to.deep.equal({ type: 'opennamespace', prefix: 'foo', uri: 'http://example.com/a' });
      expect(pulley.expect('text')).to.have.property('text', 'A');
      expect(pulley.expect('opennamespace')).to.deep.equal({ type: 'opennamespace', prefix: 'foo', uri: 'http://example.com/b' });
      expect(pulley.expect('opennamespace')).to.deep.equal({ type: 'opennamespace', prefix: 'bar', uri: 'http://example.com/a' });
      expect(pulley.expect('text')).to.have.property('text', 'B');
      expect(pulley.expect('closenamespace')).to.deep.equal({ type: 'closenamespace', prefix: 'foo', uri: 'http://example.com/b' });
      expect(pulley.expect('closenamespace')).to.deep.equal({ type: 'closenamespace', prefix: 'bar', uri: 'http://example.com/a' });
      expect(pulley.expect('text')).to.have.property('text', 'C');
    });
  });
  
  it("should include trailing text", function() {
    var pulley = makePulley('<root/> ');
    pulley.expect('opentag');
    pulley.expect('closetag');
    expect(pulley.expect('text')).to.have.property('text', ' ');
  });
});

