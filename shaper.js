function Shaper(settings){
	if(typeof(settings) !== 'object')
		throw new Error("Object with properties active_dialogs|response_time, callback_new are expected");
	
	this.settings = settings;
	this.active_dialogs = 0;
	
//	this.active_dialogs = params.active_dialogs;
//	this.response_time = params.response_time;
//	this.callback_new = params.callback_new;
	
	
	if( typeof(this.settings.callback_new) !== 'function' )
		throw new Error("callback_new needs to be function");
}

Shaper.prototype.startNewIfNeeded = function() {
	var quotaLeft = this.settings.active_dialogs - this.active_dialogs;
	var that = this;
	for( var ii = 0; ii < quotaLeft; ++ii ) {
		++that.active_dialogs;
		try {
			var inst = new Instance(
				that.settings.callback_new,
				function onResp() {
					//TODO
				},
				function onDone() {
					--that.active_dialogs;
					that.startNewIfNeeded();
				}
			);
		} catch(err) {
			console.log(err);
			--that.active_dialogs;
		}
	}	
}

Shaper.prototype.start = function() {
	this.startNewIfNeeded();
}

function Instance(cbUserNew, cbResponse, cbDone)
{
	cbUserNew(cbResponse, cbDone);
}

exports.create = function(settings) {
	return new Shaper(settings);
}