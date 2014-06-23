var common    = require('./common');
var popcount  = common.popcount;
var hashCode  = common.hashCode;
var toBitmap  = common.toBitmap;
var insertAt  = common.insertAt;
var replaceAt = common.replaceAt;
var removeAt  = common.removeAt;

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

  if (child.isLeaf) {
    var biBitmap = toBitmap(child.hcode >>> ((shift + 1) * SHIFT_STEP)) | toBitmap(leaf.hcode >>> ((shift + 1) * SHIFT_STEP));
    var biNode = new BitmapIndexedNode(biBitmap, [child, leaf]);
    return new BitmapIndexedNode(newBitmap, replaceAt(this.children, biNode, idx));
  }

  var newNode = child.assoc(shift + 1, leaf);
  return new BitmapIndexedNode(newBitmap, replaceAt(this.children, newNode, idx));
};

BitmapIndexedNode.prototype.without = function(shift, hcode, key) {

};

BitmapIndexedNode.prototype.lookup = function(shift, hcode, key) {
  var bit = toBitmap((hcode >>> (shift * SHIFT_STEP)) & MASK) & this.bitmap;

  if (!bit) {
    return null;
  }

  var child = this.at(bit);

  return child.isLeaf ? (child.key === key ? child : null) : child.lookup(shift + 1, hcode, key);
};

// BitmapIndexedNode.prototype.del = function (hcode) {
//   var bit = toBitmap((hcode >>> (this.level * SHIFT_STEP)) & MASK);
//   var exists = this.bitmap & bit;

//   if (exists) {
//     var index = popcount(this.bitmap & (bit - 1));
//     var remains = this.children.length - 1;
//     var removed = this.children[index].del(hcode);

//     if (remains === 0 && removed === null) {
//       return this;
//     }

//     if (remains === 0 && removed !== null) {
//       return removed;
//     }

//     if (remains === 1 && removed === null) {
//       return index === 0 ? this.children[1] : this.children[0];
//     }

//     if (remains === 1 && removed !== null) {
//       var remainsNode = index === 0 ? this.children[1] : this.children[0];
//       var children = replaceAt(this.children, removed, index);
//       return new BitmapIndexedNode(this.level, this._fragment, this.bitmap, children);
//     }

//     if (remains > 1 && removed === null) {
//       var children = removeAt(this.children, index);

//       /*
//         Reset a bit at given index, for example:
//           101011
//           001000
//           ------
//           100011
//        */
//       var bitmap = this.bitmap & (~toBitmap(index));
//       return new BitmapIndexedNode(this.level, this._fragment, bitmap, children);
//     }

//     if (remains > 1 && removed !== null) {
//       var children = replaceAt(this.children, removed, index);
//       return new BitmapIndexedNode(this.level, this._fragment, this.bitmap, children);
//     }
//   }
// };

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

module.exports = BitmapIndexedNode;
