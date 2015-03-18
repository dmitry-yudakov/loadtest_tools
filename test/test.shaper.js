'use strict';

var assert = require('chai').assert,
	expect = require('chai').expect,
	chai = require('chai'),
	should = chai.should(),
	shaperCreator = require('../shaper.js');

var shaper;

describe("Shaper", function () {
	describe("Exports", function () {

		it('Shaper Creator should export create function', function () {
			assert.isFunction(shaperCreator.create,
				'does not export create()');
		});

		shaper = shaperCreator.create({
			active_dialogs: 10,
			callback_new: function () {}
		});
		assert.isObject(shaper, 'created shaper is not an object');

		it('Shaper should export start function', function () {
			assert.isFunction(shaper.start,
				'shaper doesn\'t export start()');
		});

	});

	describe("Callbacks", function () {
		it('should test single instance interfaces', function (done) {
			shaper = shaperCreator.create({
				active_dialogs: 1,
				callback_new: function (cbDone, cbResp) {
					assert.isFunction(cbResp, 'callback Response is not a function');
					assert.isFunction(cbDone, 'callback Done is not a function');
					// leave it hanging for the moment
					//				cbDone();
					done();
				}
			});
			shaper.start();
		});

	});

	describe("Accuracy", function () {
		it('should test the speed - longer execution time is ok', function (done) {
			var count = 0;
			shaper = shaperCreator.create({
				active_dialogs: 4,
				callback_new: function (cbDone, cbResp) {
					++count;
					setTimeout(function () {
						cbDone();
					}, 20);
				}
			});
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(4);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(8);
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(12);
			}, 50);
			setTimeout(function () {
				expect(count).to.equal(16);
				shaper.stop();
			}, 70);
			setTimeout(function () {
				expect(count).to.equal(16);
				done();
			}, 90);
		});

	});


});