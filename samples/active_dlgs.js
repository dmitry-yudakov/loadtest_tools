var shaper = require('../shaper.js').create({
	active_dialogs: 2,
	callback_new: newDialog
});

var countThisSecond = 0;
setInterval(function() {
	console.log(countThisSecond + ' dialogs started this second');
	countThisSecond = 0;
}, 1000);


function newDialog(cbDone, cbResp) {
//	console.log('Create new dialog');
	++countThisSecond;
	setTimeout(function(){
//		console.log('Close dialog');
		cbDone();
	}, 1000);
}

shaper.start();
