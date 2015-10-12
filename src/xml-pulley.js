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
  constructor(xml, options) {
    if(!options) options = {};
    let types = options.types || ['opentag', 'closetag', 'text'];
    let queue = this.queue = new Queue();
    let parser = saxParser(true, {
      xmlns: options.xmlns,
      position: false
    });
    let skipWS = options.skipWhitespaceOnly;
    let trim = options.trim, normalize = options.normalize;
    function textOpts(t) {
      if(trim)
        t = t.trim();
      if(normalize)
        t = t.replace(/\s+/g, " ")
      return t;
    }
    let text = null, rawText = null;
    let flushText = () => {
      if(text !== null) {
        this.queue.enqueue({
          type: 'text',
          data: {text: text, rawText: rawText}
        });
        text = rawText = null;
      }
    };
    parser.onerror = (err) => {
      throw err;
    };
    types.forEach((type) => {
      if(type === 'text') {
        parser.ontext = (t) => {
          if(!skipWS || /\S/.test(t)) {
            let pt = textOpts(t);
            if(text) {
              text += pt; rawText += t;
            } else {
              text = pt; rawText = t;
            }
          }
        };
        parser.oncdata = (t) => {
          if(text) {
            text += t; rawText += t;
          } else {
            text = rawText = t;
          }
        }
      } else if(type === 'comment' && (trim || normalize)) {
        parser.oncomment = (t) => {
          flushText();
          queue.enqueue({
            type: 'comment',
            data: {text: textOpts(t), rawText: t}
          });
        }
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

export function xmlPulley(xml, options) {
  return new XMLPulley(xml, options);
}
