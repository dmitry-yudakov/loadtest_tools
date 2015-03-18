// Expected settings:
// 	active_dialogs
//	callback_new - mandatory, called when new dialog is created
//		called with arguments (cbDone, cbResponse, cbRequest)
//	max_resp_time - limit of average response time
function Shaper(settings){
	if(typeof(settings) !== 'object')
		throw new Error("Object with properties active_dialogs|response_time, callback_new are expected");
	
	this.settings = settings;
	this.active_dialogs = 0;
	this.active_state = false;
	
//	this.active_dialogs = params.active_dialogs;
//	this.response_time = params.response_time;
//	this.callback_new = params.callback_new;
	
	
	if( typeof(this.settings.callback_new) !== 'function' )
		throw new Error("callback_new needs to be function");
}

Shaper.prototype.startNewIfNeeded = function() {
	if(!this.active_state) return;

	var quotaLeft = this.settings.active_dialogs - this.active_dialogs;
	var that = this;
	for( var ii = 0; ii < quotaLeft; ++ii ) {
		++that.active_dialogs;
		try {
			var inst = new Instance(
				that.settings.callback_new,
				function onDone() {
					--that.active_dialogs;
					that.startNewIfNeeded();
				},
				function onResp() {
					//TODO
				},
				function onReq() {
					// TODO
				}
			);
		} catch(err) {
			console.log(err);
			--that.active_dialogs;
		}
	}	
}

Shaper.prototype.start = function() {
	this.active_state = true;
	this.startNewIfNeeded();
}
Shaper.prototype.stop = function() {
	this.active_state = false;
}

function Instance(cbUserNew, cbDone, cbResponse, cbRequest)
{
	cbUserNew(cbDone, cbResponse, cbRequest);
}

exports.create = function(settings) {
	return new Shaper(settings);
}