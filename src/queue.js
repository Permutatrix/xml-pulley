export default class Queue {
  constructor() {
    this.items = [];
    this.offset = 0;
  }
  enqueue(item) {
    this.items.push(item);
  }
  dequeue() {
    if(this.offset >= this.items.length) {
      return;
    }
    let out = this.items[this.offset];
    this.items[this.offset] = undefined;
    if(++this.offset * 2 >= this.items.length) {
      this.items = this.items.slice(this.offset);
      this.offset = 0;
    }
    return out;
  }
}
