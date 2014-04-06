var trie = require('./src/immutable-trie');
var BitmapIndexedNode = trie.BitmapIndexedNode;

exports.create = function () {
	return new BitmapIndexedNode(0, 0, 0, []);
};
