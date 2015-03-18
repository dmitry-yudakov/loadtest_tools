var shaper = require('../shaper.js').create({
//	active_dialogs: 10,
	response_time_msec: 110,
	callback_new: newDialog,
	debug: true
});

var countThisSecond = 0;
setInterval(function() {
	console.log(countThisSecond + ' dialogs started this second');
	countThisSecond = 0;
}, 1000);

//var plannedRespTimes = [ 80, 80, 120, 120, 100 ];
var plannedRespTimes = [ 80, 120, 80, 120, 110 ];
var dlgCount = plannedRespTimes.length;

function newDialog(cbDone, cbResp) {
//	console.log('Create new dialog');
	++countThisSecond;
	var respTime = plannedRespTimes.shift();
	plannedRespTimes.push(respTime);
	setTimeout( cbResp, respTime );
	setTimeout( cbResp, respTime*2 );
	setTimeout(function(){
//		console.log('Close dialog');
		cbDone();
	}, 1000);
}

shaper.start();
