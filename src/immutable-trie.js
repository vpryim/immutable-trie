var common    = require('./common');
var popcount  = common.popcount;
var hashCode  = common.hashCode;
var toBitmap  = common.toBitmap;
var insertAt  = common.insertAt;
var replaceAt = common.replaceAt;
var removeAt  = common.removeAt;

var SHIFT_STEP = 5;
var BUCKET_SIZE = 32;
// var SHIFT_STEP = 3;
// var BUCKET_SIZE = 8;
var MASK = BUCKET_SIZE - 1;

function BitmapIndexedNode(level, fragment, bitmap, children) {
  this.children = children;
  this.level = level;
  this.bitmap = bitmap | 0; // explicitly convert to 32-bit unsigned int
  this._fragment = fragment;
};

BitmapIndexedNode.prototype.fragment = function () {
  return this._fragment;
};

BitmapIndexedNode.prototype.add = function (key, value) {
  return this.insert(new Leaf(key, value), this.level);
};

BitmapIndexedNode.prototype.find = function (key) {
  return this.lookup(hashCode(key), key);
};

BitmapIndexedNode.prototype.remove = function (key) {
  return this.del(hashCode(key));
};

BitmapIndexedNode.prototype.insert = function (leaf, level) {
  var fragment = (leaf.hcode >>> (this.level * SHIFT_STEP)) & MASK;
  var bit = toBitmap(fragment);
  var exists = bit & this.bitmap;
  var pos = popcount(this.bitmap & (bit - 1));

  if (!exists) {
    return new BitmapIndexedNode(level, this._fragment, (this.bitmap | bit), insertAt(this.children, leaf, pos));
  }

  var newNode = this.children[pos].insert(leaf, level + 1);
  return new BitmapIndexedNode(level, this._fragment, (this.bitmap | bit), replaceAt(this.children, newNode, pos));
};

BitmapIndexedNode.prototype.lookup = function (hcode, key) {
  var bit = toBitmap((hcode >>> (this.level * SHIFT_STEP)) & MASK) & this.bitmap;

  if (bit) {
    return this._at(bit).lookup(hcode, key);
  } else {
    return null;
  }
};

BitmapIndexedNode.prototype.del = function (hcode) {
  var bit = toBitmap((hcode >>> (this.level * SHIFT_STEP)) & MASK);
  var exists = this.bitmap & bit;

  if (exists) {
    var index = popcount(this.bitmap & (bit - 1));
    var remains = this.children.length - 1;
    var removed = this.children[index].del(hcode);

    if (remains === 0 && removed === null) {
      return this;
    }

    if (remains === 0 && removed !== null) {
      return removed;
    }

    if (remains === 1 && removed === null) {
      return index === 0 ? this.children[1] : this.children[0];
    }

    if (remains === 1 && removed !== null) {
      var remainsNode = index === 0 ? this.children[1] : this.children[0];
      var children = replaceAt(this.children, removed, index);
      return new BitmapIndexedNode(this.level, this._fragment, this.bitmap, children);
    }

    if (remains > 1 && removed === null) {
      var children = removeAt(this.children, index);

      /*
        Reset a bit at given index, for example:
          101011
          001000
          ------
          100011
       */
      var bitmap = this.bitmap & (~toBitmap(index));
      return new BitmapIndexedNode(this.level, this._fragment, bitmap, children);
    }

    if (remains > 1 && removed !== null) {
      var children = replaceAt(this.children, removed, index);
      return new BitmapIndexedNode(this.level, this._fragment, this.bitmap, children);
    }
  }
};

BitmapIndexedNode.prototype._at = function (bit) {
  return this.children[popcount(this.bitmap & (bit - 1))];
};


function Leaf(key, value) {
  this.hcode = hashCode(key);
  this.key = key;
  this.value = value;
};

Leaf.prototype.lookup = function (key) {
  return this.key === key ? this.value : null;
};

Leaf.prototype.insert = function (node, level) {
  var fr1 = this.fragment(level);
  var fr2 = node.fragment(level);
  var children = fr1 > fr2 ? [node, this] : [this, node];
  var bitmap = toBitmap(fr1) | toBitmap(fr2);

  return new BitmapIndexedNode(level, this.fragment(level), bitmap, children);
};

Leaf.prototype.del = function () {
  return null;
};

Leaf.prototype.fragment = function (level) {
  return (this.hcode >>> (level * SHIFT_STEP)) & MASK;
};

exports.Leaf = Leaf;
exports.BitmapIndexedNode = BitmapIndexedNode;
