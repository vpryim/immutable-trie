var util = require('util');
var chai = require('chai');
var expect = chai.expect;

var hamt = require('../src/immutable-trie');
var toBitmap = require('../src/common').toBitmap;

var BitmapIndexedNode = hamt.BitmapIndexedNode;
var Leaf = hamt.Leaf;

function b(str){
	return parseInt(str.split(' ').join(''), 2);
}

function p(obj, d) {
	console.log(util.inspect(obj, {
		colors: true,
		depth: d || 5
	}));
}

function isLeaf (node) {
	return node instanceof Leaf;
}

describe('Leaf', function () {

	describe('#insert', function () {
		it('should create a new BitmapIndexedNode', function () {
			var node = new Leaf(b('101111'), 1);
			var newNode = node.insert(new Leaf(b('1101111'), 2), 0);
			expect(newNode).to.be.instanceOf(BitmapIndexedNode);
		});

		it('should create a new BitmapIndexedNode which contains an inserted leaf', function () {
			var A = b('01 01111');
			var B = b('11 01111');
			var node = new Leaf(A, 1);
			var newNode = node.insert(new Leaf(B, 2), 1);

			expect(newNode.find(B)).to.equals(2);
		});

		it('should create a new BitmapIndexedNode which contains a link to this leaf ', function () {
			var A = b('01 01111');
			var B = b('11 01111');
			var node = new Leaf(A, 1);
			var newNode = node.insert(new Leaf(B, 2), 1);

			expect(newNode.find(A)).to.equals(1);
		});
	});

});

describe('BitmapIndexedNode', function () {

	describe('#find', function () {
		it('should find existing value by key', function () {
			var A = b('01010');
			var biNode = new BitmapIndexedNode(0, 0, toBitmap(A), [new Leaf(A, 1)]);

			expect(biNode.find(A)).to.exist.and.equals(1);
		});

		it('can find two deep value', function () {
			var A = b('01 00001');
			var B = b('11 00001');
			var bitmap = toBitmap(A >>> 5) | toBitmap(B >>> 5);
			var biNode = new BitmapIndexedNode(1, 1, bitmap, [new Leaf(A, 1), new Leaf(B, 2)]);

			expect(biNode.find(A)).to.exist.and.equals(1);
			expect(biNode.find(B)).to.exist.and.equals(2);
		});

		it('can find three deep value', function () {
			var A = b('01 00001 10001');
			var B = b('10 00001 10001');
			var C = b('11 00001 10001');
			var bitmap = toBitmap(A >>> 10) | toBitmap(B >>> 10) | toBitmap(C >>> 10);
			var biNode = new BitmapIndexedNode(2, b('00001'), bitmap, [
				new Leaf(A, 1),
				new Leaf(B, 2),
				new Leaf(C, 3)
			]);

			expect(biNode.find(A)).to.exist.and.equals(1);
			expect(biNode.find(B)).to.exist.and.equals(2);
			expect(biNode.find(C)).to.exist.and.equals(3);
		});
	});

	describe('#add', function () {
		before(function () {
			this.A = b('1010');
			this.B = b('1011');
		});

		it('should create a new node when a new value is set', function () {
			var node = new Leaf(this.A, 1);
			var biNode = new BitmapIndexedNode(0, 0, toBitmap(this.A), [node]);
			var newNode = biNode.add(this.B, 2);
			expect(newNode).to.not.equals(node);
		});

		it('should create a new node which contains a new value', function () {
			var node = new Leaf(this.A, 1);
			var biNode = new BitmapIndexedNode(0, 0, toBitmap(this.A), [node]);
			var newNode = biNode.add(this.B, 2);

			expect(newNode.find(this.B)).to.exist.and.equals(2);
		});

		it('should create a new node which contains an old value', function () {
			var node = new Leaf(this.A, 1);
			var biNode = new BitmapIndexedNode(0, 0, toBitmap(this.A), [node]);
			var newNode = biNode.add(this.B, 2);
			expect(newNode.find(this.A)).to.exist.and.equals(1);
		});
	});

	describe('#add 32 items', function () {
		before(function () {
			this.numbers = [];
			for (var i = 0; i < 32; i++) {
				this.numbers.push(i);
			}
		});

		it('should create 32 leaf nodes', function () {
			var node = this.numbers.reduce(function (acc, n) {
				return acc.add(n, n);
			}, new BitmapIndexedNode(0, 0, 0, []));

			expect(node.children.every(isLeaf)).to.be.true;
		});
	});

	describe('#add 33 items', function () {
		before(function () {
			this.numbers = [];
			for (var i = 0; i < 33; i++) {
				this.numbers.push(i);
			}
		});

		it('should create 32 nodes on first level', function () {
			var node = this.numbers.reduce(function (acc, n) {
				return acc.add(n, n);
			}, new BitmapIndexedNode(0, 0, 0, []));

			expect(node.children).to.have.length(32);
		});

		it('should create a BitmapIndexedNode and insert it at first position', function () {
			var node = this.numbers.reduce(function (acc, n) {
				return acc.add(n, n);
			}, new BitmapIndexedNode(0, 0, 0, []));

			expect(node.children[0]).to.be.instanceof(BitmapIndexedNode);
		});

		it('should create a BitmapIndexedNode with two leaf nodes', function () {
			var node = this.numbers.reduce(function (acc, n) {
				return acc.add(n, n);
			}, new BitmapIndexedNode(0, 0, 0, []));

			expect(node.children[0].children).to.have.length(2);
			expect(node.children[0].children[0]).to.be.instanceof(Leaf);
			expect(node.children[0].children[1]).to.be.instanceof(Leaf);
		});

		it('should create a BitmapIndexedNode that share a common node', function () {
			var nodeBefore = this.numbers.slice(0, 32).reduce(function (acc, n) {
				return acc.add(n, n);
			}, new BitmapIndexedNode(0, 0, 0, []));

			var nodeAfter = nodeBefore.add(32, 32);

			expect(nodeBefore.children[0]).to.equals(nodeAfter.children[0].children[0]);
		})
	});

	describe('#remove from node which have only leaf children', function () {
		it('should return a new BitmapIndexedNode without removed item', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(2, 2)
				.add(3, 3)

			var removed = source.remove(2);

			expect(removed.find(2)).to.be.null;
			expect(removed.find(1)).to.have.exists;
			expect(removed.find(3)).to.have.exists;
		});
	});

	describe('#remove from node which have two leafs', function () {
		it('should return first leaf when second is removed', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(2, 2)

			var removed = source.remove(2);

			expect(removed).to.be.instanceof(Leaf);
			expect(removed).to.have.property('key').that.equals(1)
			expect(removed).equals(source.children[0]);
		});

		it('should return second leaf when first is removed', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(2, 2)

			var removed = source.remove(1);

			expect(removed).to.be.instanceof(Leaf);
			expect(removed).to.have.property('key').that.equals(2)
			expect(removed).equals(source.children[1]);
		});
	});

	describe('#remove deep value', function () {
		it('should return new BitmapIndexedNode without removed value', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(2, 2)
				.add(33, 33)

			var removed = source.remove(33);

			expect(removed.find(33)).to.be.null;
			expect(removed.find(1)).equals(1);
			expect(removed.find(2)).equals(2);
		});
	});

	describe('#remove deep value from BitmapIndexedNode that has only one child', function () {
		it('should return new Leaf without removed value', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(33, 33)

			var removed = source.remove(33);

			expect(removed).to.be.instanceof(Leaf);
			expect(removed).to.have.property('key').that.equals(1);
		});
	});

	describe('#remove deep value from BitmapIndexedNode that has more that two children', function () {
		it('should return new BitmapIndexedNode without removed value', function () {
			var source = new BitmapIndexedNode(0, 0, 0, [])
				.add(1, 1)
				.add(2, 2)
				.add(3, 3)
				.add(33, 33)

			var removed = source.remove(33);

			expect(removed.find(33)).to.be.null;
			expect(removed.find(1)).equals(1);
			expect(removed.find(2)).equals(2);
			expect(removed.find(3)).equals(3);
		});
	});
});

