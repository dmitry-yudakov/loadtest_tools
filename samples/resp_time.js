var shaper = require('../shaper.js').create({
	active_dialogs: 6,
	initial_dialogs: 3,
	response_time_msec: 110,
	callback_new: newDialog,
	debug: true
});

var countThisSecond = 0;
setInterval(function() {
	console.log(countThisSecond + ' dialogs started this second');
	countThisSecond = 0;
}, 1000);

var plannedRespTimes = [ 80, 120, 80, 120, 100 ];


function newDialog(cbDone, cbResp) {
	++countThisSecond;

	var respTime = plannedRespTimes.shift();
	plannedRespTimes.push(respTime);

	setTimeout( cbResp, respTime );
	setTimeout( cbResp, respTime*2 );

	setTimeout(function(){
		cbDone();
	}, 1000);
}

shaper.start();
