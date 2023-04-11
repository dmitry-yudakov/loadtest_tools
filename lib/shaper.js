let debug = false;

// Expected settings:
// 	active_dialogs - max active dialogs cap
//	callback_new - mandatory, called when new dialog is created
//		called with arguments (cbDone, cbResponse, cbRequest)
//	response_time_msec - limit of average response time
//	response_time_delta_msec - acceptable difference between real and expected response time to consider them equal
//	initial_dialogs - number of dialogs to start with
class Shaper {
  active_dialogs = 0;
  active_state = false;
  indexer = 0;

  constructor(settings) {
    if (typeof settings !== 'object')
      throw new Error(
        'Object with properties active_dialogs|response_time, callback_new are expected'
      );

    this.settings = settings;
    debug = settings.debug;

    if (typeof this.settings.callback_new !== 'function')
      throw new Error('callback_new needs to be function');
    if (!this.settings.active_dialogs && !this.settings.response_time_msec)
      throw new Error(
        'either active_dialogs or response_time_msec setting must be given'
      );
  }

  startNewIfNeeded = (recommendedQuota) => {
    if (!this.active_state) return;

    debug &&
      console.log('startNewIfNeeded(), recommendedQuota:', recommendedQuota);

    const activeDlgQuota = this.settings.active_dialogs
      ? this.settings.active_dialogs - this.active_dialogs
      : 0xffffff; //big value if no limit
    let quotaLeft = Math.min(activeDlgQuota, recommendedQuota);
    if (quotaLeft <= 0 && this.active_dialogs <= 0) {
      // no dialogs and no recommended quota, just start one to prevent stopping
      quotaLeft = 1;
    }
    if (quotaLeft <= 0) return;

    for (let ii = 0; ii < quotaLeft; ++ii) {
      ++this.active_dialogs;

      try {
        new Instance(this.settings, ++this.indexer, (avgRespTime) => {
          --this.active_dialogs;

          let recommendedNewInst = 2; //default

          if (this.settings.response_time_msec) {
            let maxRespTime = this.settings.response_time_msec;
            let delta = this.settings.response_time_delta_msec;
            if (delta && Math.abs(maxRespTime - avgRespTime) < delta) {
              // avg resp time is equal to expected
              recommendedNewInst = 1;
            } else if (avgRespTime > maxRespTime) {
              // response too slow, decrease new sessions
              recommendedNewInst = 0;
            }
          }

          this.startNewIfNeeded(recommendedNewInst);
        });
      } catch (err) {
        console.log(err);
        --this.active_dialogs;
      }
    }
  };

  start = () => {
    this.active_state = true;
    this.startNewIfNeeded(this.settings.initial_dialogs || 1);
  };
  stop = () => {
    this.active_state = false;
  };
}

class Instance {
  done = false;

  constructor(settings, inst_id, onDestroy) {
    this.inst_id = inst_id;
    this.settings = settings;
    this.onDestroy = onDestroy;

    debug && console.log('New Instance, inst id:', this.inst_id);

    if (this.settings.response_time_msec) {
      this.lastTimestamp = Date.now();
      this.sumRespTimes = 0;
      this.numResps = 0;
    }

    this.settings.callback_new(
      () => this.onDone(),
      () => this.onResp(),
      () => this.onReq()
    );
  }

  onDone = () => {
    if (this.done) return; // protection against calling onDone more than once
    this.done = true;

    debug && console.log('onDone() called, inst id:', this.inst_id);

    let avgRespTime;
    if (this.settings.response_time_msec && this.numResps) {
      avgRespTime = this.sumRespTimes / this.numResps;
    }
    this.onDestroy(avgRespTime);
  };

  onResp = () => {
    debug && console.log('onResp() called, inst id:', this.inst_id);
    if (this.settings.response_time_msec) {
      this.numResps++;
      let timeNow = Date.now();
      this.sumRespTimes += timeNow - this.lastTimestamp;
      this.lastTimestamp = timeNow;
    }
  };

  onReq = () => {
    debug && console.log('onReq() called, inst id:', this.inst_id);
    if (this.settings.response_time_msec) {
      this.lastTimestamp = Date.now();
    }
  };
}

exports.create = function (settings) {
  return new Shaper(settings);
};
