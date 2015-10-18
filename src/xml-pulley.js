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
          text: text,
          rawText: rawText
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
        };
      } else if(type === 'comment') {
        parser.oncomment = (t) => {
          flushText();
          queue.enqueue({
            type: 'comment',
            text: textOpts(t),
            rawText: t
          });
        }
      } else if(type === 'doctype') {
        parser.ondoctype = (t) => {
          flushText();
          queue.enqueue({
            type: 'doctype',
            text: t
          });
        }
      } else if(type === 'closetag') {
        parser.onclosetag = (t) => {
          flushText();
          queue.enqueue({
            type: 'closetag',
            name: t
          });
        }
      } else if(type === 'opencdata' || type === 'closecdata' ||
                type === 'opennamespace' || type === 'closenamespace') {
        parser['on'+type] = (data) => {
          flushText();
          queue.enqueue({ type: type });
        }
      } else if(isAllowedType(type)) {
        parser['on'+type] = (data) => {
          flushText();
          data.type = type;
          queue.enqueue(data);
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
  check(type, error) {
    let out = this.peek();
    assertType(out, type, error);
    return out;
  }
  checkName(name, type, wrongNameError, wrongTypeError) {
    type = type || 'opentag';
    let out = this.peek();
    assertType(out, type, wrongTypeError || wrongNameError);
    assertName(out, name, wrongNameError);
    return out;
  }
  expect(type, error) {
    let out = this.check(type, error);
    this.next();
    return out;
  }
  expectName(name, type, wrongNameError, wrongTypeError) {
    let out = this.checkName(name, type, wrongNameError, wrongTypeError);
    this.next();
    return out;
  }
  loop(callback, endType) {
    endType = endType || 'closetag';
    let node;
    while((node = this.peek()) && node.type !== endType) {
      if(callback(this))
        break;
    }
  }
  loopTag(callback, name) {
    let tag = name ? this.expectName(name) : this.expect('opentag');
    let node;
    while((node = this.peek()) && node.type !== 'closetag') {
      callback(this, tag);
    }
    this.expectName(tag.name, 'closetag');
    return tag;
  }
  skipTag(name) {
    return this.loopTag((pulley) => {
      let tag = pulley.peek();
      if(tag.type === 'opentag') {
        this.skipTag(tag.name);
      } else {
        this.next();
      }
    }, name);
  }
}

export function makePulley(xml, options) {
  return new XMLPulley(xml, options);
}

export function assertType(node, type, error) {
  if(node === undefined) {
    throw error || new Error(`Expected ${type}; got end of file!`);
  } else if(node.type !== type) {
    throw error || new Error(`Expected ${type}; got ${node.type}: ${nodeRepr(node)}!`);
  }
}
export function assertName(tag, name, error) {
  if(tag.name !== name) {
    throw error ||
          new Error(`${tag.type} had name ${tag.name} instead of ${name}!`);
  }
}

export function nodeRepr(tag) {
  switch(tag.type) {
    case 'text': case 'comment': return `"${tag.text}"`;
    case 'opentag': return `<${tag.name}>`;
    case 'closetag': return `</${tag.name}>`;
    case 'doctype': return `<!${tag.text}>`;
    case 'processinginstruction': return `<?${tag.name} ${tag.body}?>`;
    case 'attribute': return `${tag.name}="${tag.value}"`;
    default:
  }
}
