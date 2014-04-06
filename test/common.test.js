var chai = require('chai');
var expect = chai.expect;
var common = require('../src/common');

var popcount  = common.popcount;
var toBitmap  = common.toBitmap;
var insertAt  = common.insertAt;
var replaceAt = common.replaceAt;
var removeAt  = common.removeAt;

function b(str) {
	return parseInt(str.split(' ').join(), 2)
}

describe('Common functions', function () {

	describe('#popcount', function () {
		it('should return number of ones in bitmap', function () {
			expect(popcount(0)).to.equal(0);
			expect(popcount(1)).to.equal(1);
			expect(popcount(2)).to.equal(1);
			expect(popcount(3)).to.equal(2);
			expect(popcount(4)).to.equal(1);
			expect(popcount(15)).to.equal(4);
		});
	});

	describe('#toBitmap', function () {
		it('should return number which corresponds to bitmap with enabled bit on given position', function () {
			expect(toBitmap(0)).to.equal(b('1'));
			expect(toBitmap(1)).to.equal(b('10'));
			expect(toBitmap(2)).to.equal(b('100'));
			expect(toBitmap(5)).to.equal(b('100000'));
		});
	});

	describe('#insertAt', function () {
		it('should insert new value at given position', function () {
			expect(insertAt([1,2,3], 4, 1)).to.have.members([1,4,2,3]);
		});

		it('should not modify source array', function () {
			var source = [1,2,3];
			var result = insertAt(source, 4, 1);
			expect(result).to.not.equal(source);
			expect(source).to.have.members([1,2,3]);
		});
	});

	describe('#replaceAt', function () {
		it('should replace value at given position with new item', function () {
			expect(replaceAt([1,2,3], 4, 1)).to.have.members([1,4,3]);
		});

		it('should not modify source array', function () {
			var source = [1,2,3];
			var result = replaceAt(source, 4, 1);
			expect(result).to.not.equal(source);
			expect(source).to.have.members([1,2,3]);
		});
	});

	describe('#removeAt', function () {
		it('should remove value at given index', function () {
			expect(removeAt([1,2,3], 1)).to.have.members([1,3]);
		});

		it('should not modify source array', function () {
			var source = [1,2,3];
			var result = removeAt(source, 1);
			expect(result).to.not.equal(source);
			expect(source).to.have.members([1,2,3]);
		});
	});

});
