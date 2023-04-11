'use strict';

var assert = require('chai').assert,
	expect = require('chai').expect,
	chai = require('chai'),
	should = chai.should(),
	shaperCreator = require('..').Shaper;

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
					shaper.stop();
					//				cbDone();
					done();
				}
			});
			shaper.start();
		});

	});

	describe("Accuracy - longer execution times are ok", function () {
		it('should test the speed with active_dialogs', function (done) {
			var count = 0, active = 0;
			shaper = shaperCreator.create({
				active_dialogs: 4,
				callback_new: function (cbDone, cbResp) {
					++count;
					++active;
					setTimeout(function () {
						cbDone();
						cbDone();//test protection agains calling cbDone more than once
						--active;
					}, 20);
				}
			});
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(1);
				expect(active).to.equal(1);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(2);
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(7);
				expect(active).to.equal(4);
			}, 50);
			setTimeout(function () {
				expect(count).to.equal(11);
				expect(active).to.equal(4);
				shaper.stop();
			}, 70);
			setTimeout(function () {
				expect(count).to.equal(11);
				expect(active).to.equal(0);
				done();
			}, 90);
		});

		it('should test the speed with response_time_msec', function (done) {
			var count = 0, active = 0;
			var respTimes = [ 2, 2, 2, 8, 8, 8, 8, 2 ], limit = respTimes.length;
			shaper = shaperCreator.create({
				response_time_msec: 5,
				callback_new: function (cbDone, cbResp) {
					if( ++count >= limit ) shaper.stop();
					++active;
					var respTime = respTimes.shift();

					setTimeout(function () {cbResp()}, respTime);
					setTimeout(function () {cbResp()}, respTime*2);

					setTimeout(function () {
						cbDone();
						--active;
					}, 20);
				}
			});
			// it begins with 1 instance
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(1);
				expect(active).to.equal(1);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(2);
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(7);
				expect(active).to.equal(4);
			}, 50);
			setTimeout(function () {
				expect(count).to.equal(8);
				expect(active).to.equal(1);
				shaper.stop();
			}, 70);
			setTimeout(function () {
				expect(count).to.equal(8);
				expect(active).to.equal(0);
				done();
			}, 90);
		});

		it('should test the speed with active dialogs and response_time_msec', function (done) {
			var count = 0, active = 0;
			var respTimes = [ 2, 3, 3, 8, 8, 8, 2 ], limit = respTimes.length;
			shaper = shaperCreator.create({
				active_dialogs: 3,
				response_time_msec: 5,
				callback_new: function (cbDone, cbResp) {
					if( ++count >= limit ) shaper.stop();
					++active;
					var respTime = respTimes.shift();

					setTimeout(function () {cbResp()}, respTime);
					setTimeout(function () {cbResp()}, respTime*2);

					setTimeout(function () {
						cbDone();
						--active;
					}, 20);
				}
			});
			// it begins with active_dialogs instances
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(1);
				expect(active).to.equal(1);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(2);
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(6);
				expect(active).to.equal(3);
			}, 50);
			setTimeout(function () {
				expect(count).to.equal(7);
				expect(active).to.equal(1);
				shaper.stop();
			}, 70);
			setTimeout(function () {
				expect(count).to.equal(7);
				expect(active).to.equal(0);
				done();
			}, 90);
		});

		it('should test the speed with response_time_msec and delta', function (done) {
			var count = 0, active = 0;
			var respTimes = [ 2, 4, 4, 8, 8, 2 ], limit = respTimes.length;
			shaper = shaperCreator.create({
				response_time_msec: 5,
				response_time_delta_msec: 2,
				callback_new: function (cbDone, cbResp) {
					if( ++count >= limit ) shaper.stop();
					++active;
					var respTime = respTimes.shift();

					setTimeout(function () {cbResp()}, respTime);
					setTimeout(function () {cbResp()}, respTime*2);

					setTimeout(function () {
						cbDone();
						--active;
					}, 20);
				}
			});
			// it begins with active_dialogs instances
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(1);
				expect(active).to.equal(1);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(2);
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(5);
				expect(active).to.equal(2);
			}, 50);
			setTimeout(function () {
				expect(count).to.equal(6);
				expect(active).to.equal(1);
				shaper.stop();
			}, 70);
			setTimeout(function () {
				expect(count).to.equal(6);
				expect(active).to.equal(0);
				done();
			}, 90);
		});

		it('should test the speed with response_time_msec using onRequest callback', function (done) {
			var count = 0, active = 0;
			var respTimes = [ 2, 2, 2, 8, 8, 8, 8, 2 ], limit = respTimes.length;
			shaper = shaperCreator.create({
				response_time_msec: 5,
				callback_new: function (cbDone, cbResp, cbReq) {
					if( ++count >= limit ) shaper.stop();
					++active;
					var respTime = respTimes.shift();

					// call onReq on order to reset the timeoutm decreasing expected response time to 2 msec
					setTimeout(function () {cbReq()}, 6);
					setTimeout(function () {cbResp()}, 8);
					setTimeout(function () {cbReq()}, 8+6);
					setTimeout(function () {cbResp()}, 8+8);

					setTimeout(function () {
						cbDone();
						--active;
					}, 20);
				}
			});
			// it begins with 1 instance
			shaper.start();
			setTimeout(function () {
				expect(count).to.equal(1);
				expect(active).to.equal(1);
			}, 10);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(2);
				shaper.stop();
			}, 30);
			setTimeout(function () {
				expect(count).to.equal(3);
				expect(active).to.equal(0);
				done();
			}, 50);
		});

	});


});