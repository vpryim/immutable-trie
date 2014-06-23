var common   = require('./common');
var hashCode = common.hashCode;
var isValue  = common.isValue;

var BitmapIndexedNode = require('./BitmapIndexedNode');
var LeafNode = require('./LeafNode');

function Trie(count, root) {
  this.count = count;
  this.root = root;
}

Trie.Empty = new Trie(0, BitmapIndexedNode.Empty);

Trie.prototype.assoc = function(key, value) {
  var node = new LeafNode(hashCode(key), key, value);
  var newRoot = this.root.assoc(0, node);

  return new Trie(this.count + 1, newRoot);
};

Trie.prototype.without = function(key) {
  var newRoot = this.root.without(0, hashCode(key), key);
  return newRoot === this.root ? this : new Trie(this.count - 1, newRoot);
};

Trie.prototype.has = function(key) {
  return isValue(this.root.lookup(0, hashCode(key), key));
};

Trie.prototype.reduce = function(fn, init) {

};

module.exports = Trie;
