var expect = require('chai').expect;
var xmlPulley = require('../lib/xml-pulley.js').xmlPulley;

describe("xmlPulley()", function() {
  it("should throw when passed an invalid type", function() {
    expect(function() { xmlPulley('', false, {types: ['text', 'error']}) }).to.throw();
  });
  
  it("should not throw when passed only valid types", function() {
    expect(function() { xmlPulley('', false, {types: ['text', 'opentag']}) }).to.not.throw();
  });
  
  it("should pass options on to sax.parser", function() {
    var pulley = xmlPulley('<ROOT />', false, {lowercase: true});
    expect(pulley.expect('opentag')).to.have.property('name', 'root');
  });
  
  it("should throw when given invalid XML", function() {
    expect(function() { xmlPulley('</invalid>', true); }).to.throw();
  });
  
  it("should include trailing text", function() {
    var pulley = xmlPulley('Not actually valid XML', false);
    expect(pulley.expect('text')).to.equal('Not actually valid XML');
  });
});

describe("XMLPulley", function() {
  describe("next()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = xmlPulley('');
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should probably work, that might be important down the line", function() {
      var pulley = xmlPulley('<root>A <tag attr="value">tag. <tag>And another.</tag></tag> Nice.</root>', true);
      expect(pulley.expect('opentag')).to.have.property('name', 'root');
      expect(pulley.expect('text')).to.equal('A ');
      var tag = pulley.expect('opentag');
      expect(tag).to.have.property('name', 'tag');
      expect(tag).to.have.deep.property('attributes.attr', 'value');
      expect(pulley.expect('text')).to.equal('tag. ');
      expect(pulley.expect('opentag')).to.have.property('name', 'tag');
      expect(pulley.expect('text')).to.equal('And another.');
      expect(pulley.expect('closetag')).to.equal('tag');
      expect(pulley.expect('closetag')).to.equal('tag');
      expect(pulley.expect('text')).to.equal(' Nice.');
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
      var pulley1 = xmlPulley('<root attr="val" />', true);
      var pulley2 = xmlPulley('<root attr="val" />', true);
      expect(pulley1.peek()).to.deep.equal(pulley2.next());
    });
    
    it("should return the same value on consecutive calls", function() {
      var pulley = xmlPulley('<root />', true);
      expect(pulley.peek()).to.equal(pulley.peek());
    });
  });
  
  describe("expect()", function() {
    it("should throw when the next node isn't of the specified type", function() {
      var pulley = xmlPulley('<root />', true);
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should throw when there's no more data", function() {
      var pulley = xmlPulley('', true);
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should behave like next().data on success", function() {
      var pulley1 = xmlPulley('<root attr="val" />', true);
      var pulley2 = xmlPulley('<root attr="val" />', true);
      expect(pulley1.expect('opentag')).to.deep.equal(pulley2.next().data);
    });
    
    it("should move up the queue on success", function() {
      var pulley = xmlPulley('<root />', true);
      expect(function() {
        pulley.expect('opentag');
        pulley.expect('closetag');
      }).to.not.throw();
    });
    
    it("should leave the queue untouched on failure", function() {
      var pulley = xmlPulley('<root />', true);
      expect(function() { pulley.expect('closetag'); }).to.throw();
      expect(function() { pulley.expect('opentag'); }).to.not.throw();
    });
  });
});

describe("Behavior", function() {
  describe("Collapsing text", function() {
    it("should collapse text and CDATA into a single text node", function() {
      var pulley = xmlPulley('<mlp>Pinkie Pie<![CDATA[ > oth]]>er ponies</mlp>', true);
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.equal('Pinkie Pie > other ponies');
    });
    
    it("should collapse text across boundaries of unmatched types", function() {
      var pulley = xmlPulley('<dhsb><bad-horse>Bad Horse,</bad-horse> Bad Horse!</dhsb>', true, {types: ['text']});
      expect(pulley.expect('text')).to.equal('Bad Horse, Bad Horse!');
    });
  });
});

