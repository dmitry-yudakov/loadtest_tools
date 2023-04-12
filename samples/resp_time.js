const shaper = require('..').Shaper.create({
  active_dialogs: 6,
  response_time_msec: 110,
  callback_new: newDialog,
  debug: true,
});
const initial_dialogs = 3;

let countThisSecond = 0;
setInterval(function () {
  console.log(countThisSecond + ' dialogs started this second');
  countThisSecond = 0;
}, 1000);

const plannedRespTimes = [80, 120, 80, 120, 100];

function newDialog(cbDone, cbResp) {
  ++countThisSecond;

  const respTime = plannedRespTimes.shift();
  plannedRespTimes.push(respTime);

  setTimeout(cbResp, respTime);
  setTimeout(cbResp, respTime * 2);

  setTimeout(function () {
    cbDone();
  }, 1000);
}

shaper.start(initial_dialogs);
