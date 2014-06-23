var chai = require('chai');
var expect = chai.expect;

var Trie = require('../src/Trie');

function add(x, y) {
  return x + y;
}

function inc(x) {
  return x + 1;
}

describe('Trie', function() {
  describe('#assoc', function() {
    it('should add a new value into empty trie', function() {
      var trie = Trie.Empty.assoc(1, 1);
      expect(trie.has(1)).is.true;
    });

    it('should a several new values into empty trie', function() {
      var trie = Trie.Empty.assoc(1, 1).assoc(2, 2).assoc(3, 3);
      expect(trie.has(1)).is.true;
      expect(trie.has(2)).is.true;
      expect(trie.has(3)).is.true;
    });
  });

  describe('#reduce', function () {
    before(function () {
      this.numbers = [];
      for (var i = 0; i < 100; i++) {
        this.numbers.push(i);
      }
    });

    it('can calculate count', function () {
      var trie = this.numbers.reduce(function (acc, n) {
        return acc.assoc(n, n);
      }, Trie.Empty);

      expect(trie.reduce(inc, 0)).to.equals(this.numbers.length);
    });

    it('can calculate sum', function () {
      var trie = this.numbers.reduce(function (acc, n) {
        return acc.assoc(n, n);
      }, Trie.Empty);

      expect(trie.reduce(add, 0)).to.equals(this.numbers.reduce(add, 0));
    });

    it('can make a new trie with incremented values', function () {
      var trie = this.numbers.reduce(function (acc, n) {
        return acc.assoc(n, n);
      }, Trie.Empty);

      function makeNode(tree, n) {
        return tree.assoc(n + 1, n + 1);
      }

      var incTrie = trie.reduce(makeNode, Trie.Empty);

      expect(incTrie.reduce(add, 0)).to.equals(this.numbers.map(inc).reduce(add, 0));
      expect(this.numbers.every(function (n) {
        return incTrie.has(n + 1);
      })).to.be.true;
    });
  });
});
