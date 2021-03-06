var debug = true;

// Expected settings:
// 	active_dialogs - max active dialogs cap
//	callback_new - mandatory, called when new dialog is created
//		called with arguments (cbDone, cbResponse, cbRequest)
//	response_time_msec - limit of average response time
//	response_time_delta_msec - acceptable difference between real and expected response time to consider them equal
//	initial_dialogs - number of dialogs to start with
function Shaper(settings){
	if(typeof(settings) !== 'object')
		throw new Error("Object with properties active_dialogs|response_time, callback_new are expected");
	
	this.settings = settings;
	this.active_dialogs = 0;
	this.active_state = false;
	debug = settings.debug;
	this.indexer = 0;
	
//	this.active_dialogs = params.active_dialogs;
//	this.response_time = params.response_time;
//	this.callback_new = params.callback_new;
	
	
	if( typeof(this.settings.callback_new) !== 'function' )
		throw new Error("callback_new needs to be function");
	if( !this.settings.active_dialogs && !this.settings.response_time_msec )
		throw new Error("either active_dialogs or response_time_msec setting must be given");
}

Shaper.prototype.startNewIfNeeded = function(recommendedQuota) {
	if(!this.active_state) return;

	if(debug) console.log('startNewIfNeeded(), recommendedQuota:', recommendedQuota);
	var activeDlgQuota = ( this.settings.active_dialogs ? this.settings.active_dialogs - this.active_dialogs : 0xFFFFFF );//big value if no limit
	var quotaLeft = Math.min(activeDlgQuota, recommendedQuota);
	if(quotaLeft <= 0 && this.active_dialogs <= 0) { // no dialogs and no recommended quota, just start one to prevent stopping
		quotaLeft = 1;
	}
	if( quotaLeft <= 0 ) return;

	var that = this;
	for( var ii = 0; ii < quotaLeft; ++ii ) {
		++that.active_dialogs;
		try {
			var inst = new Instance(that, ++that.indexer);
		} catch(err) {
			console.log(err);
			--that.active_dialogs;
		}
	}	
}

Shaper.prototype.start = function() {
	this.active_state = true;
	this.startNewIfNeeded(this.settings.initial_dialogs || 1);
}
Shaper.prototype.stop = function() {
	this.active_state = false;
}

function Instance(shaper, inst_id)
{
	this.inst_id = inst_id;
	this.done = false;
	if(debug) console.log('New Instance, inst id:', this.inst_id);
	this.parentShaper = shaper;
	if(shaper.settings.response_time_msec) {
		this.lastTimestamp = Date.now();
		this.sumRespTimes = 0;
		this.numResps = 0;
	}
	var that = this;
	shaper.settings.callback_new(function(){that.onDone()}, function(){that.onResp()}, function(){that.onReq()});
}
Instance.prototype.onDone = function() {
	if(this.done) return; // protection against calling onDone more than once
	this.done = true;

	if(debug) console.log('onDone() called, inst id:', this.inst_id);
	--this.parentShaper.active_dialogs;
	var recommendedNewInst = 2;//default
	if(this.parentShaper.settings.response_time_msec && this.numResps) {
		var avgRespTime = this.sumRespTimes/this.numResps;
		var maxRespTime = this.parentShaper.settings.response_time_msec;
		var delta = this.parentShaper.settings.response_time_delta_msec;
		if(delta && Math.abs(maxRespTime-avgRespTime) < delta) { // avg resp time is equal to expected
			recommendedNewInst = 1;
		} else if(avgRespTime > maxRespTime) { // response too slow, decrease new sessions
			recommendedNewInst = 0;
		}
	}
	this.parentShaper.startNewIfNeeded(recommendedNewInst);
},
Instance.prototype.onResp = function() {
	if(debug) console.log('onResp() called, inst id:', this.inst_id);
	if(this.parentShaper.settings.response_time_msec) {
		this.numResps++;
		var timeNow = Date.now();
		this.sumRespTimes += timeNow - this.lastTimestamp;
		this.lastTimestamp = timeNow;
	}
},
Instance.prototype.onReq = function() {
	if(debug) console.log('onReq() called, inst id:', this.inst_id);
	if(this.parentShaper.settings.response_time_msec) {
		this.lastTimestamp = Date.now();
	}
}

exports.create = function(settings) {
	return new Shaper(settings);
}