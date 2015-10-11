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
  constructor(xml, strict, options) {
    this.options = options = options || {};
    let types = options.types || ['opentag', 'closetag', 'text'];
    let queue = this.queue = new Queue();
    let parser = saxParser(strict, options);
    let text = null;
    let flushText = () => {
      if(text) {
        this.queue.enqueue({type: 'text', data: text});
        text = null;
      }
    };
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
    parser.write(xml).close();
    flushText();
  }
  next() {
    return this.queue.dequeue();
  }
  peek() {
    return this.queue.peek();
  }
  expect(type) {
    let out = this.peek();
    if(out === undefined) {
      throw new Error(`Expected ${type}; got end of file!`);
    } else if(out.type !== type) {
      throw new Error(`Expected ${type}; got ${out.type}!`);
    }
    this.next();
    return out.data;
  }
}

export function xmlPulley(xml, strict, options) {
  return new XMLPulley(xml, strict, options);
}
