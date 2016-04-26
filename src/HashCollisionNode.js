import { find } from './common';

export default class HashCollisionNode {
  constructor(hcode, children) {
    this.hcode = hcode;
    this.children = children;
    this.isLeaf = false;
  }

  assoc(shift, leaf) {
    return new HashCollisionNode(this.hcode, this.children.concat(leaf));
  }

  without(shift, hcode, key) {
    if (this.children.length === 2 && this.children[0].key === key) {
      return this.children[1];
    }

    if (this.children.length === 2 && this.children[1].key === key) {
      return this.children[0];
    }

    return new HashCollisionNode(this.hcode, this.children.filter(child => child.key !== key));
  }

  lookup(shift, hcode, key) {
    return find(this.children, child => child.key === key);
  }

  reduce(fn, init) {
    var acc = init,
        len = this.children.length,
        i = -1;

    while(++i < len) {
      acc = fn(acc, this.children[i].value);
    }

    return acc;
  }

  kvreduce(fn, init) {
    var acc = init,
        len = this.children.length,
        i = -1;

    while(++i < len) {
      var c = this.children[i];
      acc = fn(acc, c.key, c.value);
    }

    return acc;
  }
}
