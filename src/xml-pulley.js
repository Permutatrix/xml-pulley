import { parser as saxParser } from 'sax';
import Queue from './queue.js';

class XMLPulley {
  constructor(strict, options) {
    this.options = options;
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
    parser.ontext = parser.oncdata = (t) => {
      text = text ? text + t : t;
    };
    parser.onopentag = (tag) => {
      flushText();
      queue.enqueue({type: 'opentag', data: tag});
    };
    parser.onclosetag = (tag) => {
      flushText();
      queue.enqueue({type: 'closetag', data: tag});
    };
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
