var common    = require('./common');
var popcount  = common.popcount;
var toBitmap  = common.toBitmap;
var insertAt  = common.insertAt;
var replaceAt = common.replaceAt;
var removeAt  = common.removeAt;

var HashCollisionNode = require('./HashCollisionNode');

var SHIFT_STEP = 5;
var BUCKET_SIZE = 32;
var MASK = BUCKET_SIZE - 1;


function BitmapIndexedNode(bitmap, children) {
  this.bitmap = bitmap | 0; // explicitly convert to 32-bit unsigned int
  this.children = children;
  this.isLeaf = false;
}

BitmapIndexedNode.Empty = new BitmapIndexedNode(0, []);

BitmapIndexedNode.prototype.assoc = function(shift, leaf) {
  var fragment = (leaf.hcode >>> (shift * SHIFT_STEP)) & MASK;
  var bit = toBitmap(fragment);
  var exists = bit & this.bitmap;
  var idx = popcount(this.bitmap & (bit - 1));
  var newBitmap = this.bitmap | bit;

  if (!exists) {
    return new BitmapIndexedNode(newBitmap, insertAt(this.children, leaf, idx));
  }

  var child = this.children[idx];

  if (child.isLeaf && child.key === leaf.key) {
    return new BitmapIndexedNode(this.bitmap, replaceAt(this.children, leaf, idx));
  }

  if (child.isLeaf && child.hcode === leaf.hcode) {
    var hcNode = new HashCollisionNode(child.hcode, [child, leaf]);
    return new BitmapIndexedNode(this.bitmap, replaceAt(this.children, hcNode, idx));
  }

  if (child.isLeaf) {
    var biBitmap = toBitmap(child.hcode >>> ((shift + 1) * SHIFT_STEP)) | toBitmap(leaf.hcode >>> ((shift + 1) * SHIFT_STEP));
    var biNode = new BitmapIndexedNode(biBitmap, [child, leaf]);
    return new BitmapIndexedNode(newBitmap, replaceAt(this.children, biNode, idx));
  }

  var newNode = child.assoc(shift + 1, leaf);
  return new BitmapIndexedNode(newBitmap, replaceAt(this.children, newNode, idx));
};

BitmapIndexedNode.prototype.without = function(shift, hcode, key) {
  var bit = toBitmap((hcode >>> (this.level * SHIFT_STEP)) & MASK);
  var exists = this.bitmap & bit;


  if (exists) {
    var index = popcount(this.bitmap & (bit - 1));
    var remains = this.children.length - 1;
    var child = this.children[index];

    if (child.isLeaf && this.children.length > 2) {
      var children = removeAt(this.children, index);

      /*
        Reset a bit at given index, for example:
          101011
          001000
          ------
          100011
       */
      var bitmap = this.bitmap & (~toBitmap(index + 1));
      return new BitmapIndexedNode(bitmap, children);
    }

    if (child.isLeaf && this.children.length === 2) {
      return this.children[index === 1 ? 0 : 1];
    }

    if (child.isLeaf && this.children.length === 1) {
      return BitmapIndexedNode.Empty;
    }

    var newNode = this.children[index].without(shift + 1, hcode, key);
    var children = replaceAt(this.children, newNode, index);
    return new BitmapIndexedNode(this.bitmap, children);
  }

  return this;
};

BitmapIndexedNode.prototype.lookup = function(shift, hcode, key) {
  var bit = toBitmap((hcode >>> (shift * SHIFT_STEP)) & MASK) & this.bitmap;

  if (!bit) {
    return null;
  }

  var child = this.at(bit);

  return child.isLeaf ? (child.key === key ? child : null) : child.lookup(shift + 1, hcode, key);
};

BitmapIndexedNode.prototype.at = function (bit) {
  return this.children[popcount(this.bitmap & (bit - 1))];
};

BitmapIndexedNode.prototype.reduce = function (fn, init) {
  var acc = init,
      len = this.children.length,
      i = -1;

  while(++i < len) {
    var child = this.children[i];

    acc = child.isLeaf ? fn(acc, child.value) : child.reduce(fn, acc);
  }

  return acc;
};

BitmapIndexedNode.prototype.kvreduce = function (fn, init) {
  var acc = init,
      len = this.children.length,
      i = -1;

  while(++i < len) {
    var child = this.children[i];

    acc = child.isLeaf ? fn(acc, child.key, child.value) : child.kvreduce(fn, acc);
  }

  return acc;
};

module.exports = BitmapIndexedNode;
