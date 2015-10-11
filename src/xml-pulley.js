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
    this.text = null;
    parser.onerror = (err) => {
      throw err;
    };
    types.forEach((type) => {
      if(type === 'text') {
        parser.ontext = parser.oncdata = (t) => {
          this.text = this.text ? this.text + t : t;
        };
      } else if(isAllowedType(type)) {
        parser['on'+type] = (data) => {
          this._flushText();
          queue.enqueue({type: type, data: data});
        }
      } else {
        throw new Error(`${type} isn't an allowed type!`);
      }
    });
  }
  _flushText() {
    if(this.text) {
      this.queue.enqueue({type: 'text', data: this.text});
      this.text = null;
    }
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
      this._flushText();
    }
    return this;
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

export function xmlPulley(strict, options) {
  return new XMLPulley(strict, options);
}
