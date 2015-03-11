# loadtest_tools

## Introduction

These tools are intended to provide some utils for executing load tests.

It's actually one tool for the moment called Shaper. Its idea is to detect max speed of loadtesting by some criteria like max active dialogs number.

Check samples/ and test/ to get more ideas how to use it.

Here's some sample code:
```js
var shaper = require('./shaper.js').create({
	active_dialogs: 2,
	callback_new: newDialog
});

var countThisSecond = 0;
setInterval(function() {
	console.log(countThisSecond + ' dialogs started this second');
	countThisSecond = 0;
}, 1000);


function newDialog(cbOnResp, cbDone) {
	console.log('Create new dialog');
	++countThisSecond;
	setTimeout(function(){
		console.log('Close dialog');
		cbDone();
	}, 1000);
}

shaper.start();
```

The idea is creating Shaper instance giving it paramers for testing. The parameters are:

* active_dialogs - max number of active dialogs, it's to prevent overloading
* callback_new - function the you provide starting new "dialog" or whatever you're intended to loadtest

Then call start() - the shaper will call provided callback creating instances of your dialogs until active_dialogs number is reached. Then it will only create new dialog when some existing dies. To understand this call cbDone callback that you receive as second argument when callback_new is called.

Call stop() if you want the shaper to stop() generating new dialogs. It doesn't kill existing ones.


## Install

Clone the repo from gitlab:

```sh
git clone git@github.com:dmitry-yudakov/loadtest_tools.git
```

## Interface

### Shaper

* create( paramsObject ) - creates shaper instance with given parameters, call start() to get it going

```js
var shaper = require('./shaper.js').create({
	active_dialogs: 2,
	callback_new: function(cbResp, cbDone) {
	  //create new dlg, call cbDone() when done
	}
});
```
* start() - starts generating dialogs calling callback_new function

* stop() - stops generating new dialogs, existing ones aren't killed

