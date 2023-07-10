//Stopwatch weakmaps
const _stoppedTimestamp = new WeakMap();
const _restartTimestamp = new WeakMap();
const _lastTick = new WeakMap();
const _animationId = new WeakMap();
const _isRunning = new WeakMap();

export class Stopwatch extends EventTarget {
  constructor() {
    super();
    //Properties
    _stoppedTimestamp.set(this, null);
    _restartTimestamp.set(this, null);
    _lastTick.set(this, null);
    _animationId.set(this, null);
    _isRunning.set(this, false);

    this.ms = 0;
    this.speed = 1;
  }

  tick(timestamp) {
    //Get the duration while the stopwatch was on pause
    const stopDuration =
      _restartTimestamp.get(this) - _stoppedTimestamp.get(this);
    //Get the elapsed time between each tick (current timestamp minus last tick timestamp + the stop duration to recaliber the last tick), all of that mumltiplied by the stopwatch speed
    this.ms += (timestamp - (stopDuration + _lastTick.get(this))) * this.speed;
    _lastTick.set(this, timestamp);
    // If a stop duration was set, we reset it to null as we only need to account for it for the first tick after a restart
    if (stopDuration !== 0) {
      _restartTimestamp.set(this, null);
      _stoppedTimestamp.set(this, null);
    }

    dispatchEvent(new Event("tick"));

    _animationId.set(this, requestAnimationFrame(this.tick.bind(this)));
  }

  startStopwatch() {
    if (_isRunning.get(this)) throw new Error("Stopwatch already running");
    _isRunning.set(this, true);
    // Only set startTime to now if stopwatch is at 0
    if (!_animationId.get(this)) {
      _lastTick.set(this, performance.now());
    } else {
      _restartTimestamp.set(this, performance.now());
    }

    _animationId.set(this, requestAnimationFrame(this.tick.bind(this)));
  }

  stopStopwatch() {
    if (!_isRunning.get(this)) throw new Error("Stopwatch already stopped");
    _isRunning.set(this, false);
    cancelAnimationFrame(_animationId.get(this));
    _stoppedTimestamp.set(this, performance.now());
  }

  resetStopwatch() {
    cancelAnimationFrame(_animationId.get(this));
    _animationId.set(this, null);
    _lastTick.set(this, null);
    _restartTimestamp.set(this, null);
    _stoppedTimestamp.set(this, null);
    _isRunning.set(this, false);
    this.ms = 0;
  }

  set stopwatchSpeed(speed) {
    if (speed < 0)
      throw new Error("Impossible to set a null or negative speed");
    this.speed = speed;
  }
}

export class TimeConverter {
  //Static methods
  static #calculateTimeComponents(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return { minutes, seconds, milliseconds };
  }

  static msToMin(ms) {
    const convertedTime = TimeConverter.#calculateTimeComponents(ms);

    return convertedTime;
  }

  static displayStandardTimeFromMs(ms) {
    const convertedTime = TimeConverter.#calculateTimeComponents(ms);

    return `${convertedTime.minutes}:${convertedTime.seconds < 10 ? "0" : ""}${
      convertedTime.seconds
    }:${
      convertedTime.milliseconds < 10
        ? "00"
        : convertedTime.milliseconds < 100
        ? "0"
        : ""
    }${Math.floor(convertedTime.milliseconds)}`;
  }
}
