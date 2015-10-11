var expect = require('chai').expect;
var xmlPulley = require('../lib/xml-pulley.js');

describe("xmlPulley()", function() {
  it("should throw when passed an invalid type", function() {
    expect(function() { xmlPulley(true, {types: ['text', 'error']}) }).to.throw();
  });
  
  it("should not throw when passed only valid types", function() {
    expect(function() { xmlPulley(true, {types: ['text', 'opentag']}) }).to.not.throw();
  });
  
  it("should pass options on to sax.parser", function() {
    var pulley = xmlPulley(false, {lowercase: true}).write('<ROOT />').close();
    expect(pulley.expect('opentag')).to.have.deep.property('data.name', 'root');
  });
});

describe("XMLPulley", function() {
  describe("write()", function() {
    it("should throw when called on a closed pulley", function() {
      var pulley = xmlPulley(true).close();
      expect(function() { pulley.write('<root />'); }).to.throw();
    });
    
    it("should throw when given invalid XML", function() {
      var pulley = xmlPulley(true);
      expect(function() { pulley.write('</invalid>'); }).to.throw();
    });
    
    it("should return itself for chaining", function() {
      var pulley = xmlPulley(true);
      expect(pulley.write('<root />')).to.equal(pulley);
    });
  });
  
  describe("close()", function() {
    it("should flush remaining text", function() {
      var pulley = xmlPulley(false).write('Not actually valid XML').close();
      expect(pulley.expect('text')).to.have.property('data', 'Not actually valid XML');
    });
    
    it("should return itself for chaining", function() {
      var pulley = xmlPulley(true);
      expect(pulley.close()).to.equal(pulley);
    });
  });
  
  describe("next()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = xmlPulley(true).close();
      expect(pulley.next()).to.be.undefined;
    });
    
    it("should probably work, that might be important down the line", function() {
      var pulley = xmlPulley(true).write('<root>A <tag attr="value">tag. <tag>And another.</tag></tag> Nice.</root>').close();
      expect(pulley.expect('opentag')).to.have.deep.property('data.name', 'root');
      expect(pulley.expect('text')).to.have.property('data', 'A ');
      var tag = pulley.expect('opentag');
      expect(tag).to.have.deep.property('data.name', 'tag');
      expect(tag).to.have.deep.property('data.attributes.attr', 'value');
      expect(pulley.expect('text')).to.have.property('data', 'tag. ');
      expect(pulley.expect('opentag')).to.have.deep.property('data.name', 'tag');
      expect(pulley.expect('text')).to.have.property('data', 'And another.');
      expect(pulley.expect('closetag')).to.have.property('data', 'tag');
      expect(pulley.expect('closetag')).to.have.property('data', 'tag');
      expect(pulley.expect('text')).to.have.property('data', ' Nice.');
      expect(pulley.expect('closetag')).to.have.property('data', 'root');
      expect(pulley.next()).to.be.undefined;
    });
  });
  
  describe("peek()", function() {
    it("should return undefined when there's no more data", function() {
      var pulley = xmlPulley(true).close();
      expect(pulley.peek()).to.be.undefined;
    });
    
    it("should return the same as next()", function() {
      var pulley1 = xmlPulley(true).write('<root attr="val" />').close();
      var pulley2 = xmlPulley(true).write('<root attr="val" />').close();
      expect(pulley1.peek()).to.deep.equal(pulley2.next());
    });
    
    it("should return the same value on consecutive calls", function() {
      var pulley = xmlPulley(true).write('<root />').close();
      expect(pulley.peek()).to.equal(pulley.peek());
    });
  });
  
  describe("expect()", function() {
    it("should throw when the next node isn't of the specified type", function() {
      var pulley = xmlPulley(true).write('<root />').close();
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should throw when there's no more data", function() {
      var pulley = xmlPulley(true).write('<root />').close();
      pulley.expect('opentag');
      pulley.expect('closetag');
      expect(function() { pulley.expect('text'); }).to.throw();
    });
    
    it("should behave like next() when the next node is of the specified type", function() {
      var pulley1 = xmlPulley(true).write('<root attr="val" />').close();
      var pulley2 = xmlPulley(true).write('<root attr="val" />').close();
      expect(pulley1.expect('opentag')).to.deep.equal(pulley2.next());
    });
    
    it("should move up the queue on success", function() {
      var pulley = xmlPulley(true).write('<root />').close();
      expect(function() {
        pulley.expect('opentag');
        pulley.expect('closetag');
      }).to.not.throw();
    });
    
    it("should leave the queue untouched on failure", function() {
      var pulley = xmlPulley(true).write('<root />').close();
      expect(function() { pulley.expect('closetag'); }).to.throw();
      expect(function() { pulley.expect('opentag'); }).to.not.throw();
    });
  });
});

describe("Behavior", function() {
  describe("Collapsing text", function() {
    it("should collapse text and CDATA into a single text node", function() {
      var pulley = xmlPulley(true).write('<mlp>Pinkie Pie<![CDATA[ > oth]]>er ponies</mlp>').close();
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('data', 'Pinkie Pie > other ponies');
    });
    
    it("should collapse chunked CDATA into a single text node", function() {
      var pulley = xmlPulley(true).write('<hs><![CDATA[Equius <').write('> Nepeta]]></hs>').close();
      pulley.expect('opentag');
      expect(pulley.expect('text')).to.have.property('data', 'Equius <> Nepeta');
    });
    
    it("should collapse text and CDATA across boundaries of unmatched types", function() {
      var pulley = xmlPulley(true, {types: ['text']}).write('<dhsb><bad-horse>Bad Horse,</bad-horse> Bad Horse!</dhsb>').close();
      expect(pulley.expect('text')).to.have.property('data', 'Bad Horse, Bad Horse!');
    });
  });
});

