# loadtest_tools

## Introduction

This project provides some tools for executing load tests.

It's actually one tool for the moment called _Shaper_. Its idea is to detect max speed of loadtesting by some criteria like max active dialogs number and/or response time. This way it adapts to the system you're testing and allows to determine max load it takes without overloading it.

## How it works

Create Shaper instance passing it initial parameters. Then call _start()_.

The shaper will create X dialogs (1 by default) - when a dialog ends, the shaper will start another 2, 1 or 0 new dialogs depending on the limiting conditions - this process repeats endlessly.

It's possible to set _active_dialogs_ cap limiting total number of active dialogs.

Setting _response_time_msec_ allows the shaper to decide home many new dialogs to start after given dialog ends based on its average response time. It starts 2 if average response time is lower than _response_time_msec_, 0 - if average response time is higher than response*time_msec and 1 if the times are close (\_response_time_delta_msec* defines acceptable closeness).

Creating your new dialogs is implemented by calling _callback_new_ parameter that you provide. When _callback_new_ called, the arguments are _cbDone_, _cbResp_ and _cbReq_. Calling _cbDone_ indicates end of given dialog, calling _cbResp_ registers internally response time since last _cbResp/cbReq_ calling or dialog begin. Calling _onReq_ resets internal timestamp, used for calculating response time - you may omit it if you send request right after receiving response.

Here's some sample code:

```js
var shaper = require('../shaper.js').create({
  active_dialogs: 10,
  response_time_msec: 110,
  callback_new: newDialog,
});

var countThisSecond = 0;
setInterval(function () {
  console.log(countThisSecond + ' dialogs started this second');
  countThisSecond = 0;
}, 1000);

var plannedRespTimes = [80, 120, 80, 120, 110];

function newDialog(cbDone, cbResp) {
  ++countThisSecond;

  // take response time used for simulation
  var respTime = plannedRespTimes.shift();
  plannedRespTimes.push(respTime);

  // simulate couple of responses
  setTimeout(cbResp, respTime);
  setTimeout(cbResp, respTime * 2);

  // simulate dialog end
  setTimeout(function () {
    cbDone();
  }, 300);
}

shaper.start();
```

I create shaper instance and some code simulating dialog with calling _cbResp()_ and _cbDone()_ after some time. Response times are taken from _plannedRespTimes_ array and are repeated in cycle.

## Install

Clone the repo from gitlab:

```sh
git clone git@github.com:dmitry-yudakov/loadtest_tools.git
```

## Interface

### Shaper

- _create( params )_ - creates shaper instance with given parameters, then call _start()_ to get it going. Supported params are:
- _active_dialogs_ - max number of active dialogs, it's to prevent overloading
- _response_time_msec_ - max average response time deciding whether to start 2, 1 or 0 new dialogs after each dialog end
- _response_time_delta_msec_ - difference between average response time and _response_time_msec_ allowing to accept them as equal
- _callback_new_ - function the you provide starting new "dialog" or whatever you're intended to loadtest
- _start([<initial_dialogs>=0])_ - starts generating dialogs calling callback_new function, can be called multiple times for more flexible starting control
- _stop()_ - stops generating new dialogs, note that existing ones aren't killed

- _callback_new(cbDone, cbResp, cbReq)_ - your function passed as one of the Shaper settings, it will be called allowing you to create your dialog. When it's called few callbacks are passed as arguments. Use them to indicate your dialog end or getting some responses.
  - _cbDone_ - call it when your dialog ends - it will trigger creating new one, if conditions allow
  - _cbResp_ - call it when you receive response - it's used to measure response time since last _cbReq()_ call or last _cbResp()_ call or dialog begin
  - _cbReq_ - call it when you send request - it's optional and may be ommitted if you send request right after dialog begin or receiving response.
