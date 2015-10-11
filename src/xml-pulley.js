import { parser as saxParser } from 'sax';
import Queue from './queue.js';

function isAllowedType(type) {
  switch(type) {
    case 'text': case 'opentag': case 'closetag': case 'doctype':
    case 'processinginstruction': case 'attribute': case 'comment':
    case 'opencdata': case 'closecdata': case 'opennamespace':
    case 'closenamespace': return true;
    default: return false;
  }
}

class XMLPulley {
  constructor(strict, options) {
    this.options = options = options || {};
    let types = options.types || ['opentag', 'closetag', 'text'];
    let queue = this.queue = new Queue();
    let parser = this.parser = saxParser(strict, options);
    let text = null;
    function flushText() {
      if(text) {
        queue.enqueue({type: 'text', data: text});
        text = null;
      }
    }
    parser.onerror = (err) => {
      throw err;
    };
    types.forEach((type) => {
      if(type === 'text') {
        parser.ontext = parser.oncdata = (t) => {
          text = text ? text + t : t;
        };
      } else if(isAllowedType(type)) {
        parser['on'+type] = (data) => {
          flushText();
          queue.enqueue({type: type, data: data});
        }
      } else {
        throw new Error(`${type} isn't an allowed type!`);
      }
    });
  }
  write(xml) {
    if(this.parser)
      this.parser.write(xml);
    else
      throw new Error("Can't write to a closed XMLPulley!");
    return this;
  }
  close() {
    if(this.parser) {
      this.parser.close();
      this.parser = null;
    }
    return this;
  }
  next() {
    return this.queue.dequeue();
  }
  expect(type) {
    let out = this.next();
    if(out === undefined) {
      throw new Error(`Expected ${type}; got end of file!`);
    } else if(out.type !== type) {
      throw new Error(`Expected ${type}; got ${out.type}!`);
    }
    return out;
  }
}

export default function xmlPulley(strict, options) {
  return new XMLPulley(strict, options);
}
