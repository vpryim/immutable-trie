var chai = require('chai');
var expect = chai.expect;

var Trie = require('../src/Trie');

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
});
