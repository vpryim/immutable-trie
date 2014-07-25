var util = require('util');
var chai = require('chai');
var expect = chai.expect;

var BitmapIndexedNode = require('../src/BitmapIndexedNode');
var HashCollisionNode = require('../src/HashCollisionNode');
var LeafNode = require('../src/LeafNode');
var toBitmap = require('../src/common').toBitmap;

function b(str){
  return parseInt(str.split(' ').join(''), 2);
}

function p(obj, d) {
  console.log('\n');
  console.log(util.inspect(obj, {
    colors: true,
    depth: d || 5
  }));
}

function isLeaf(node) {
  return node.hasOwnProperty('key');
}

function hashCode(value) {
  var hash = 0, character;

  if (typeof value === 'number') {
    return value;
  }

  if (value.length === 0) return hash;

  for (var i = 0, l = value.length; i < l; ++i) {
    character = value.charCodeAt(i);
    hash = (((hash << 5) - hash) + character) | 0; // Convert to 32bit integer
  }

  return hash;
}

describe('BitmapIndexedNode', function () {
  describe('#assoc', function () {
    describe('- insert LeafNode in empty BitmapIndexedNode:', function() {
      before(function () {
        this.A = b('1010');
      });

      it('should create a new BitmapIndexedNode', function () {
        var leaf = new LeafNode(this.A, this.A, 1);
        var biNode = new BitmapIndexedNode(0, []);
        var newNode = biNode.assoc(0, biNode);
        expect(newNode).to.not.equals(biNode);
      });

      it('should add a new leaf at first position', function() {
        var leaf = new LeafNode(this.A, this.A, 1);
        var biNode = new BitmapIndexedNode(0, []);
        var newNode = biNode.assoc(0, leaf);
        expect(newNode.children[0]).to.equals(leaf);
      });
    });

    describe('- insert LeafNode in non-empty BitmapIndexedNode:', function() {
      before(function () {
        this.A = b('1010');
        this.B = b('1011');
      });

      it('should create a new BitmapIndexedNode', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode).to.not.equals(biNode);
      });

      it('should leave the old leaf at the same position', function() {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[0]).to.equals(leafA);
      });

      it('should add a new leaf at second position', function() {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[1]).to.equals(leafB);
      });
    });

    describe('- insert LeafNode at position with existing LeafNode:', function() {
      before(function () {
        this.A = b('00 01010');
        this.B = b('11 01010');
      });

      it('should create a new BitmapIndexedNode', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode).to.not.equals(biNode);
      });

      it('should create a new BitmapIndexedNode at the conflicted position', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[0]).to.be.instanceOf(BitmapIndexedNode);
      });

      it('the new BitmapIndexedNode should have the old leaf node', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[0].children[0]).to.equals(leafA);
      });

      it('the new BitmapIndexedNode should have the new leaf node', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[0].children[1]).to.equals(leafB);
      });

      it('should leave the same bitmap for top BitmapIndexedNode', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.bitmap.toString(2)).to.equals(biNode.bitmap.toString(2));
      });

      it('should set correct bitmap for the inserted BitmapIndexedNode', function () {
        var leafA = new LeafNode(this.A, this.A, 1);
        var leafB = new LeafNode(this.B, this.B, 2);
        var biNode = new BitmapIndexedNode(toBitmap(this.A), [leafA]);
        var newNode = biNode.assoc(0, leafB);
        expect(newNode.children[0].bitmap.toString(2)).to.equals('1001');
      });

    });

    describe('- insert LeafNode at position with existing BitmapIndexedNode:', function() {
      before(function() {
        var A = new LeafNode(b('00 01010'), b('00 01010'), 1);
        var B = new LeafNode(b('11 01010'), b('11 01010'), 2);
        var C = new LeafNode(b('10 01010'), b('11 01010'), 2);
        this.fullNode = BitmapIndexedNode.Empty.assoc(0, A).assoc(0, B);
      });

      it('should create a new BitmapIndexedNode on the insert position', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 3);
        var newNode = this.fullNode.assoc(0, D);

        expect(newNode.children[0]).to.be.instanceof(BitmapIndexedNode);
        expect(newNode.children[0]).to.not.equal(this.fullNode.children[0]);
      });

      it('new BitmapIndexedNode should have three members', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 3);
        var newNode = this.fullNode.assoc(0, D);

        expect(newNode.children[0].children).to.have.length(3);
      });
    });

    describe('- add 32 items:', function () {
      before(function () {
        this.numbers = [];
        for (var i = 0; i < 32; i++) {
          this.numbers.push(i);
        }
      });

      it('should create 32 leaf nodes', function () {
        var node = this.numbers.reduce(function (acc, n) {
          return acc.assoc(0, new LeafNode(n, n, n));
        }, BitmapIndexedNode.Empty);

        expect(node.children.every(isLeaf)).to.be.true;
      });
    });

    describe('- add 33 items:', function () {
      before(function () {
        this.numbers = [];
        for (var i = 0; i < 33; i++) {
          this.numbers.push(i);
        }
      });

      it('should create 32 nodes on first level', function () {
        var node = this.numbers.reduce(function (acc, n) {
          return acc.assoc(0, new LeafNode(n, n, n));
        }, BitmapIndexedNode.Empty);

        expect(node.children).to.have.length(32);
      });

      it('should create a BitmapIndexedNode and insert it at first position', function () {
        var node = this.numbers.reduce(function (acc, n) {
          return acc.assoc(0, new LeafNode(n, n, n));
        }, BitmapIndexedNode.Empty);

        expect(node.children[0]).to.be.instanceof(BitmapIndexedNode);
      });

      it('should create a BitmapIndexedNode with two leaf nodes', function () {
        var node = this.numbers.reduce(function (acc, n) {
          return acc.assoc(0, new LeafNode(n, n, n));
        }, BitmapIndexedNode.Empty);

        expect(node.children[0].children).to.have.length(2);
        expect(isLeaf(node.children[0].children[0])).to.be.true;
        expect(isLeaf(node.children[0].children[1])).to.be.true;
      });

      it('should create a BitmapIndexedNode that share a common node', function () {
        var nodeBefore = this.numbers.slice(0, 32).reduce(function (acc, n) {
          return acc.assoc(0, new LeafNode(n, n, n));
        }, BitmapIndexedNode.Empty);

        var nodeAfter = nodeBefore.assoc(0, new LeafNode(32, 32, 32));

        expect(nodeBefore.children[0]).to.equals(nodeAfter.children[0].children[0]);
      });
    });

    describe('- insert two values with different keys but equal hashcodes', function() {
      it('should create new HashCollisionNode on the collision place', function() {
        var A = new LeafNode(hashCode('AaAa'), 'AaAa', 'value1');
        var B = new LeafNode(hashCode('BBBB'), 'BBBB', 'value2');
        var node = BitmapIndexedNode.Empty.assoc(0, A).assoc(0, B);
        expect(node.children[0]).to.be.instanceof(HashCollisionNode);
      });
    });

    describe('- insert two different values with equal keys', function() {
      it('should leave only last value', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value1');
        var B = new LeafNode(hashCode('key'), 'key', 'value2');
        var node = BitmapIndexedNode.Empty.assoc(0, A).assoc(0, B);
        expect(node.lookup(0, hashCode('key'), 'key')).to.exist.and.equals(B);
      });
    });
  });


  describe('#lookup', function () {

    it('should find existing leaf node by key', function () {
      var A = b('01010');
      var leaf = new LeafNode(A, A, 1);
      var biNode = new BitmapIndexedNode(toBitmap(A), [leaf]);
      expect(biNode.lookup(0, A, A)).to.exist.and.equals(leaf);
    });

    it('can find two deep value', function () {
      var A = b('01 00001');
      var B = b('11 00001');

      var bitmap = toBitmap(A >>> 5) | toBitmap(B >>> 5);

      var leafA = new LeafNode(A, A, 1);
      var leafB = new LeafNode(B, B, 2);

      var innerBiNode = new BitmapIndexedNode(bitmap, [leafA, leafB]);
      var outerBiNode = new BitmapIndexedNode(bitmap, [innerBiNode]);

      expect(outerBiNode.lookup(0, A, A)).to.exist.and.equals(leafA);
      expect(outerBiNode.lookup(0, B, B)).to.exist.and.equals(leafB);
    });

    it('can find three deep value', function () {
      var A = b('01 00001 10001');
      var B = b('10 00001 10001');
      var C = b('11 00001 10001');

      var leafA = new LeafNode(A, A, 1);
      var leafB = new LeafNode(B, B, 2);
      var leafC = new LeafNode(C, C, 3);

      var bitmap = toBitmap(A >>> 10) | toBitmap(B >>> 10) | toBitmap(C >>> 10);

      var innerBiNode1 = new BitmapIndexedNode(bitmap, [leafA, leafB, leafC]);
      var innerBiNode2 = new BitmapIndexedNode(toBitmap(b('00001')), [innerBiNode1]);
      var outerBiNode = new BitmapIndexedNode(toBitmap(b('10001')), [innerBiNode2]);

      expect(outerBiNode.lookup(0, A, A)).to.exist.and.equals(leafA);
      expect(outerBiNode.lookup(0, B, B)).to.exist.and.equals(leafB);
      expect(outerBiNode.lookup(0, C, C)).to.exist.and.equals(leafC);
    });
  });


  describe('#without', function () {
    describe('- remove from node which have only leaf children:', function () {
      it('should return a new BitmapIndexedNode without removed item', function () {
        var source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(1, 1, 1))
          .assoc(0, new LeafNode(2, 2, 2))
          .assoc(0, new LeafNode(3, 3, 3))

        var removed = source.without(0, 2, 2);

        expect(removed.lookup(0, 2, 2)).to.not.exists;
        expect(removed.lookup(0, 1, 1)).to.exist.and.have.property('value').that.equals(1);
        expect(removed.lookup(0, 3, 3)).to.exist.and.have.property('value').that.equals(3);
      });

      it('should keep values in previous BitmapIndexedNode', function () {
        var source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(1, 1, 1))
          .assoc(0, new LeafNode(2, 2, 2))
          .assoc(0, new LeafNode(3, 3, 3))

        source.without(0, 2, 2);

        expect(source.lookup(0, 2, 2)).to.exist.and.have.property('value').that.equals(2);
        expect(source.lookup(0, 1, 1)).to.exist.and.have.property('value').that.equals(1);
        expect(source.lookup(0, 3, 3)).to.exist.and.have.property('value').that.equals(3);
      });
    });

    describe('- remove deep value:', function () {
      it('should return new BitmapIndexedNode without removed value', function () {
        var A = b('00 10001');
        var B = b('01 10001');
        var C = b('10 10001');

        var source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(A, A, 1))
          .assoc(0, new LeafNode(B, B, 2))
          .assoc(0, new LeafNode(C, C, 3))

        var removed = source.without(0, A, A);

        expect(removed.lookup(0, A, A)).to.not.exists;
        expect(removed.lookup(0, B, B)).to.exist.and.have.property('value').that.equals(2);
        expect(removed.lookup(0, C, C)).to.exist.and.have.property('value').that.equals(3);
      });
    });

    describe('- remove deep value from BitmapIndexedNode that has only one child', function () {
      it('should reduce to the one BitmapIndexedNode', function () {
        var A = b('1 00001');
        var source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(1, 1, 1))
          .assoc(0, new LeafNode(A, A, A))

        var removed = source.without(0, A, A);

        expect(removed.lookup(0, A, A)).to.not.exists;
        expect(removed.lookup(0, 1, 1)).to.exist.and.have.property('value').that.equals(1);
        expect(removed.children.length).to.equals(1);
        expect(removed.children[0].isLeaf).to.be.true;
      });
    });

    describe('- remove deep value from BitmapIndexedNode that has more that two children:', function () {
      it('should return new BitmapIndexedNode without removed value', function () {
        var A = b('0 00011');
        var B = b('1 00001');
        var source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(1, 1, 1))
          .assoc(0, new LeafNode(2, 2, 2))
          .assoc(0, new LeafNode(A, A, A))
          .assoc(0, new LeafNode(B, B, B))

        var removed = source.without(0, B, B);

        expect(removed.lookup(0, B, B)).to.not.exists;
        expect(removed.lookup(0, 1, 1)).to.exist.and.have.property('value').that.equals(1);
        expect(removed.lookup(0, 2, 2)).to.exist.and.have.property('value').that.equals(2);
        expect(removed.lookup(0, A, A)).to.exist.and.have.property('value').that.equals(A);
      });
    });

    describe('- remove value from single-item BitmapIndexedNode', function() {
      it('should return BitmapIndexedNode.Empty', function() {
        var source = BitmapIndexedNode.Empty.assoc(0, new LeafNode(1, 1, 1));
        expect(source.without(0, 1, 1)).to.equal(BitmapIndexedNode.Empty);
      });
    });

    describe('- remove value that does not exists', function() {
      it('should return this node', function() {
        expect(BitmapIndexedNode.Empty.without(0, 1, 1)).to.equal(BitmapIndexedNode.Empty);

        var source = BitmapIndexedNode.Empty.assoc(0, new LeafNode(1, 1, 1));
        expect(source.without(0, 2, 2)).to.equal(source);
      });
    });
  });

  describe('#reduce', function() {
    it('can calculate sum of child values', function() {
      var sum = function(a, b) { return a + b; };
      var A = new LeafNode(hashCode('key1'), 'key1', 1);
      var B = new LeafNode(hashCode('key2'), 'key2', 2);
      var hnode = BitmapIndexedNode.Empty.assoc(0, A).assoc(0, B);

      expect(hnode.reduce(sum, 0)).to.equal(3);
    });
  });

  describe('#kvreduce', function() {
    it('can collect entry list', function() {
      var makeEntry = function(acc, key, value) {
        acc.push([key, value]);
        return acc;
      };

      var A = new LeafNode(hashCode('key1'), 'key1', 1);
      var B = new LeafNode(hashCode('key2'), 'key2', 2);
      var hnode = BitmapIndexedNode.Empty.assoc(0, A).assoc(0, B);

      expect(hnode.kvreduce(makeEntry, [])).to.have.deep.members([['key1', 1], ['key2', 2]]);
    });
  });

  describe('#mutableAssoc', function() {
    beforeEach(function() {
      this.root = {};
    });

    describe('- insert value in empty node:', function() {
      it('should create a new BitmapIndexedNode', function () {
        var A = new LeafNode(hashCode('key'), 'key', 'value');
        var node = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A);
        expect(node).to.not.equal(BitmapIndexedNode.Empty);
      });

      it('new BitmapIndexedNode should have inserted leaf', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value');
        var node = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A);
        expect(node.children).to.have.length(1);
        expect(node.children[0]).to.equals(A);
      });

      it('new BitmapIndexedNode should have correct root', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value');
        var node = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A);
        expect(node.root).to.equal(this.root);
      });
    });

    describe('- insert two values with equal keys:', function() {
      it('should modify node', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value1');
        var B = new LeafNode(hashCode('key'), 'key', 'value2');
        var node1 = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A);
        var node2 = node1.mutableAssoc(this.root, 0, B);
        expect(node2).to.equal(node1);
      });

      it('should update value', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value1');
        var B = new LeafNode(hashCode('key'), 'key', 'value2');
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B)

        expect(node.children).to.have.length(1);
        expect(node.children[0]).to.equal(B);
      });
    });

    describe('- insert two values with different keys but equal hashcodes:', function() {
      it('should modify node', function() {
        var A = new LeafNode(hashCode('AaAa'), 'AaAa', 'value1');
        var B = new LeafNode(hashCode('BBBB'), 'BBBB', 'value2');
        var node1 = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A);
        var node2 = node1.mutableAssoc(this.root, 0, B);
        expect(node2).to.equal(node1);
      });

      it('should create a new HashCollisionNode', function() {
        var A = new LeafNode(hashCode('AaAa'), 'AaAa', 'value1');
        var B = new LeafNode(hashCode('BBBB'), 'BBBB', 'value2');
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.children[0]).to.be.instanceof(HashCollisionNode);
      });

      it('first value should be reachable', function() {
        var A = new LeafNode(hashCode('AaAa'), 'AaAa', 'value1');
        var B = new LeafNode(hashCode('BBBB'), 'BBBB', 'value2');
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.lookup(0, hashCode('AaAa'), 'AaAa')).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value1');
      });

      it('second value should be reachable', function() {
        var A = new LeafNode(hashCode('AaAa'), 'AaAa', 'value1');
        var B = new LeafNode(hashCode('BBBB'), 'BBBB', 'value2');
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.lookup(0, hashCode('BBBB'), 'BBBB')).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value2');
      });
    });

    describe('- insert LeafNode at position with existing LeafNode: ', function() {
      beforeEach(function () {
        this.A = b('00 01010');
        this.B = b('11 01010');
      });

      it('should modify node', function() {
        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var node1 = BitmapIndexedNode.Empty.mutableAssoc(this.root, 0, A)
        var node2 = node1.mutableAssoc(this.root, 0, B);
        expect(node2).to.equal(node1);
      });

      it('should create a new BitmapIndexedNode on LeafNode position', function() {
        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.children[0]).to.be.instanceof(BitmapIndexedNode);
      });

      it('new BitmapIndexedNode should have correct root', function() {
        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.children[0].root).to.equal(node.root);
      });

      it('first value should be reachable', function() {
        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.lookup(0, this.A, this.A)).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(1);
      });

      it('second value should be reachable', function() {
        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var node = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B);

        expect(node.lookup(0, this.B, this.B)).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(2);
      });
    });

    describe('- insert LeafNode at position with existing BitmapIndexedNode:', function() {
      beforeEach(function() {
        this.A = b('00 01010');
        this.B = b('11 01010');
        this.C = b('10 01010');

        var A = new LeafNode(this.A, this.A, 1);
        var B = new LeafNode(this.B, this.B, 2);
        var C = new LeafNode(this.C, this.C, 3);

        this.root = {};
        this.fullNode = BitmapIndexedNode.Empty
          .mutableAssoc(this.root, 0, A)
          .mutableAssoc(this.root, 0, B)
          .mutableAssoc(this.root, 0, C);
      });

      it('should modify node', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 4);
        var newNode = this.fullNode.mutableAssoc(this.root, 0, D);
        expect(newNode).to.equal(this.fullNode);
      });

      it('should create a new BitmapIndexedNode on the insert position', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 3);
        var newNode = this.fullNode.mutableAssoc(this.root, 0, D);

        expect(newNode.children[0]).to.be.instanceof(BitmapIndexedNode);
        expect(newNode.children[0]).to.equal(this.fullNode.children[0]);
      });

      it('first value should be reachable', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 4);
        var node = this.fullNode.mutableAssoc(this.root, 0, D);
        expect(node.lookup(0, this.A, this.A)).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(1);
      });

      it('second value should be reachable', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 4);
        var node = this.fullNode.mutableAssoc(this.root, 0, D);
        expect(node.lookup(0, this.B, this.B)).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(2);
      });

      it('third value should be reachable', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 4);
        var node = this.fullNode.mutableAssoc(this.root, 0, D);
        expect(node.lookup(0, this.C, this.C)).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(3);
      });

      it('fourth value should be reachable', function() {
        var D = new LeafNode(b('111 01010'), b('111 01010'), 4);
        var node = this.fullNode.mutableAssoc(this.root, 0, D);
        expect(node.lookup(0, b('111 01010'), b('111 01010'))).to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(4) ;
      });

    });
  });

  describe('#mutableWithout', function() {
    describe('- remove value from non-editable node', function() {
      before(function() {
        this.root = {};

        this.A = new LeafNode(hashCode('key1'), 'key1', 'value1');
        this.B = new LeafNode(hashCode('key2'), 'key2', 'value2');
        this.C = new LeafNode(hashCode('key3'), 'key3', 'value3');

        this.node1 = BitmapIndexedNode.Empty
          .assoc(0, this.A)
          .assoc(0, this.B)
          .assoc(0, this.C)

        this.node2 = this.node1.mutableWithout(this.root, 0, hashCode('key1'), 'key1');
      });

      it('should return a new BitmapIndexedNode', function() {
        expect(this.node2).to.be.instanceof(BitmapIndexedNode).and.not.equal(this.node1);
      });

      it('new BitmapIndexedNode should not have removed value', function() {
        expect(this.node2.lookup(0, hashCode('key1'), 'key1')).to.be.null;
      });

      it('new BitmapIndexedNode should have non-removed values', function() {
        expect(this.node2.lookup(0, hashCode('key2'), 'key2'))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value2');

        expect(this.node2.lookup(0, hashCode('key3'), 'key3'))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value3');
      });
    });

    describe('- remove value from editable node', function() {
      before(function() {
        this.root = {};

        this.A = new LeafNode(hashCode('key1'), 'key1', 'value1');
        this.B = new LeafNode(hashCode('key2'), 'key2', 'value2');
        this.C = new LeafNode(hashCode('key3'), 'key3', 'value3');
        this.D = new LeafNode(hashCode('key4'), 'key4', 'value4');

        this.node1 = BitmapIndexedNode.Empty
          .assoc(0, this.A)
          .assoc(0, this.B)
          .assoc(0, this.C)
          .assoc(0, this.D)

        this.node2 = this.node1.mutableWithout(this.root, 0, hashCode('key1'), 'key1');
        this.node3 = this.node2.mutableWithout(this.root, 0, hashCode('key2'), 'key2');
      });

      it('should modify this node', function() {
        expect(this.node3).to.equal(this.node2);
      });

      it('removed values should not be reachable', function() {
        expect(this.node3.lookup(0, hashCode('key1'), 'key1')).to.be.null;
        expect(this.node3.lookup(0, hashCode('key2'), 'key2')).to.be.null;
      });

      it('non-removed values should be reachable', function() {
        expect(this.node3.lookup(0, hashCode('key3'), 'key3'))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value3');

        expect(this.node3.lookup(0, hashCode('key4'), 'key4'))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal('value4');
      });
    });

    describe('- remove from empty node', function() {
      it('should return empty node', function() {
        expect(BitmapIndexedNode.Empty.mutableWithout({}, 0, hashCode('key'), 'key'))
          .to.equal(BitmapIndexedNode.Empty);
      });
    });

    describe('- remove last value', function() {
      it('should return empty node', function() {
        var A = new LeafNode(hashCode('key'), 'key', 'value');
        var node = BitmapIndexedNode.Empty.assoc(0, A);
        expect(node.mutableWithout({}, 0, hashCode('key'), 'key'))
          .to.equal(BitmapIndexedNode.Empty);
      });
    });

    describe('- remove one of two node values', function() {
      it('should collapse to leaf node', function() {
        var A = new LeafNode(hashCode('key1'), 'key1', 'value1');
        var B = new LeafNode(hashCode('key2'), 'key2', 'value2');

        var node = BitmapIndexedNode.Empty
          .assoc(0, A)
          .assoc(0, B)
          .mutableWithout({}, 0, hashCode('key1'), 'key1')

        expect(node).to.equal(B);
      });
    });

    describe('- remove missing value', function() {
      it('should return the same node unchanged', function() {
        var A = new LeafNode(hashCode('key1'), 'key1', 'value1');
        var B = new LeafNode(hashCode('key2'), 'key2', 'value2');

        var node1 = BitmapIndexedNode.Empty
          .assoc(0, A)
          .assoc(0, B)

        var node2 = node1.mutableWithout({}, 0, hashCode('missing'), 'missing')

        expect(node2).to.equal(node1);
        expect(node2.children).to.deep.equal(node1.children);
        expect(node2.bitmap).to.equal(node1.bitmap);
      });
    });

    describe('- remove deep value', function() {
      before(function() {
        this.A = b('00 10001');
        this.B = b('01 10001')
        this.C = b('10 10001')

        this.source = BitmapIndexedNode.Empty
          .assoc(0, new LeafNode(this.A, this.A, 1))
          .assoc(0, new LeafNode(this.B, this.B, 2))
          .assoc(0, new LeafNode(this.C, this.C, 3))

        this.removed = this.source.mutableWithout({}, 0, this.A, this.A);
      });

      it('removed value should not be reachable', function() {
        expect(this.removed.lookup(0, this.A, this.A)).to.be.null;
      });

      it('non-removed values should be reachable', function() {
        expect(this.removed.lookup(0, this.B, this.B))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(2);

        expect(this.removed.lookup(0, this.C, this.C))
          .to.be.instanceof(LeafNode)
          .and.have.property('value').that.equal(3);
      });
    });
  });
});
