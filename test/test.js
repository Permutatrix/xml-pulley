var expect = require('chai').expect;
var xmlPulley = require('../lib/xml-pulley.js').xmlPulley;

describe("xmlPulley()", function() {
  it("should throw when passed an invalid type", function() {
    expect(function() { xmlPulley('', {types: ['text', 'error']}) }).to.throw();
  });
  
  it("should not throw when passed only valid types", function() {
    expect(function() { xmlPulley('', {types: ['text', 'opentag']}) }).to.not.throw();
  });
  
  it("should throw when given invalid XML", function() {
    expect(function() { xmlPulley('</invalid>'); }).to.throw();
  });
});

describe("XMLPulley", function() {
  describe("next()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = xmlPulley('');
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should probably work, that might be important down the line", function() {
      var pulley = xmlPulley('<root>A <tag attr="value">tag. <tag>And another.</tag></tag> Nice.</root>');
      expect(pulley.expect('opentag')).to.have.property('name', 'root');
      expect(pulley.expect('text')).to.have.property('text', 'A ');
      var tag = pulley.expect('opentag');
      expect(tag).to.have.property('name', 'tag');
      expect(tag).to.have.deep.property('attributes.attr', 'value');
      expect(pulley.expect('text')).to.have.property('text', 'tag. ');
      expect(pulley.expect('opentag')).to.have.property('name', 'tag');
      expect(pulley.expect('text')).to.have.property('text', 'And another.');
      expect(pulley.expect('closetag')).to.equal('tag');
      expect(pulley.expect('closetag')).to.equal('tag');
      expect(pulley.expect('text')).to.have.property('text', ' Nice.');
      expect(pulley.expect('closetag')).to.equal('root');
      expect(pulley.next()).to.be.undefined;
    });
  });
  
  describe("peek()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = xmlPulley('');
      expect(pulley.peek()).to.be.undefined;
    });
    
    it("should return the same as next()", function() {
      var pulley1 = xmlPulley('<root attr="val" />');
      var pulley2 = xmlPulley('<root attr="val" />');
      expect(pulley1.peek()).to.deep.equal(pulley2.next());
    });
    
    it("should return the same value on consecutive calls", function() {
      var pulley = xmlPulley('<root />');
      expect(pulley.peek()).to.equal(pulley.peek());
    });
  });
  
  describe("expect()", function() {
    it("should throw when the next node isn't of the specified type", function() {
      var pulley = xmlPulley('<root />');
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should throw when there's no more data", function() {
      var pulley = xmlPulley('');
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should behave like next().data on success", function() {
      var pulley1 = xmlPulley('<root attr="val" />');
      var pulley2 = xmlPulley('<root attr="val" />');
      expect(pulley1.expect('opentag')).to.deep.equal(pulley2.next().data);
    });
    
    it("should move up the queue on success", function() {
      var pulley = xmlPulley('<root />');
      pulley.expect('opentag');
      pulley.expect('closetag');
    });
    
    it("should leave the queue untouched on failure", function() {
      var pulley = xmlPulley('<root />');
      expect(function() { pulley.expect('closetag'); }).to.throw();
      pulley.expect('opentag');
    });
  });
});

describe("Behavior", function() {
  describe("Collapsing text", function() {
    it("should collapse text and CDATA into a single text node", function() {
      var pulley = xmlPulley('<mlp>Pinkie Pie<![CDATA[ > oth]]>er ponies</mlp>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'Pinkie Pie > other ponies');
    });
    
    it("should collapse text across boundaries of unmatched types", function() {
      var pulley = xmlPulley('<dhsb><bad-horse>Bad Horse,</bad-horse> Bad Horse!</dhsb>', {types: ['text']});
      expect(pulley.expect('text')).to.have.property('text', 'Bad Horse, Bad Horse!');
    });
  });
  
  describe("Trimming", function() {
    it("should trim text when given options.trim", function() {
      var pulley = xmlPulley('<root>\n  Look at me with my fancy indentation\n</root>', {trim: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'Look at me with my fancy indentation');
    });
    
    it("should not trim text by default", function() {
      var pulley = xmlPulley('<root>   This part of XML is super annoying.\n</root>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '   This part of XML is super annoying.\n');
    });
    
    it("should not skip whitespace-only nodes when given only options.trim", function() {
      var pulley = xmlPulley('<root>\n</root>', {trim: true});
      pulley.expect('opentag');
      pulley.expect('text');
    });
    
    it("should not trim CDATA", function() {
      var pulley = xmlPulley('<root><![CDATA[   ]]></root>', {trim: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '   ');
    });
  });
  
  describe("Skipping whitespace-only nodes", function() {
    it("should skip whitespace-only nodes when given options.skipWhitespaceOnly", function() {
      var pulley = xmlPulley('<root>\n</root>', {skipWhitespaceOnly: true});
      pulley.expect('opentag');
      pulley.expect('closetag');
    });
    
    it("should not skip whitespace-only nodes by default", function() {
      var pulley = xmlPulley('<root>\n</root>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '\n');
    });
    
    it("should not skip non-whitespace text nodes", function() {
      var pulley = xmlPulley('<root>  Text  </root>', {skipWhitespaceOnly: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '  Text  ');
    });
  });
  
  describe("Normalization", function() {
    it("should collapse whitespace when given options.normalize", function() {
      var pulley = xmlPulley('<sbahj>I WARNED YOU ABOUT STAIRS BRO!!!!\n\n\nI TOLD YOU DOG!</sbahj>', {normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'I WARNED YOU ABOUT STAIRS BRO!!!! I TOLD YOU DOG!');
    });
    
    it("should not collapse whitespace by default", function() {
      var pulley = xmlPulley('<sbahj>I TOLD YOU MAN\n\nI TOLD YOU ABOUT STAIRS!</sbahj>');
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', 'I TOLD YOU MAN\n\nI TOLD YOU ABOUT STAIRS!');
    });
    
    it("should not normalize CDATA", function() {
      var pulley = xmlPulley('<root><![CDATA[\n data  ]]></root>', {normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('text', '\n data  ');
    });
  });
  
  describe("rawText", function() {
    it("should provide unmodified raw text when trimming and normalizing", function() {
      var pulley = xmlPulley('<root>\n  Writing   tests   is boring.\n</root>', {trim: true, normalize: true});
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('rawText', '\n  Writing   tests   is boring.\n');
    });
    
    it("should be equal to text when trimming and normalizing are disabled", function() {
      var pulley = xmlPulley('<root>\n  Writing   tests   is still boring.\n</root>');
      pulley.expect('opentag');
      var text = pulley.expect('text');
      expect(text.text).to.equal(text.rawText);
    });
    
    it("should apply to comments, as well", function() {
      var pulley = xmlPulley('<!--\n  This is\n  a comment.\n-->', {trim: true, normalize: true, types: ['comment']});
      expect(pulley.expect('comment')).to.have.property('rawText', '\n  This is\n  a comment.\n');
    });
  });
  
  describe("Namespaces", function() {
    it("should provide namespace info when given options.xmlns", function() {
      var pulley = xmlPulley('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {xmlns: true});
      expect(pulley.expect('opentag')).to.have.property('ns');
    });
    
    it("should not provide namespace info by default", function() {
      var pulley = xmlPulley('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      expect(pulley.expect('opentag')).to.not.have.property('ns');
    });
  });
  
  it("should include trailing text", function() {
    var pulley = xmlPulley('<root /> ');
    pulley.expect('opentag');
    pulley.expect('closetag');
    expect(pulley.expect('text')).to.have.property('text', ' ');
  });
});

