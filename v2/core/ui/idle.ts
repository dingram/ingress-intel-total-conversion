/**
 * IITC idle mode controller.
 *
 * Prevents needless requests if the browser window is hidden or hasn't been
 * touched in some time.
 */
namespace iitc.idle {
  /** The maximum idle time, in seconds. */
  export const MAX_IDLE_TIME = 15 * 60;
  /** How often to poll for activity, in seconds. */
  export const IDLE_POLL_TIME = 10;

  /** The time we have been idle so far, in seconds. */
  export var idleTime: number = 0;
  /** The limit beyond which we are considered to have become idle. */
  var idleTimeLimit: number = MAX_IDLE_TIME;
  /** Callbacks to run just as we go idle. */
  var pauseFunctions: (() => void)[] = [];
  /** Callbacks to run just as we come back from being idle. */
  var resumeFunctions: (() => void)[] = [];
  /** The last known mouse X position. */
  var lastMouseX: number = 0;
  /** The last known mouse Y position. */
  var lastMouseY: number = 0;

  /**
   * Return whether we are currently considered to be idle.
   */
  export function isIdle(): boolean {
    return idleTime >= idleTimeLimit;
  }

  /**
   * Poll for whether the page is visible or not, and update the amount of time
   * we have been idle so far.
   */
  function poll(): void {
    var wasIdle = isIdle();
    idleTime += IDLE_POLL_TIME;

    var hidden = (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || false);
    if (hidden) {
      // set a small time limit before entering idle mode
      idleTimeLimit = iitc.REFRESH_INTERVAL;
    }
    if (!wasIdle && isIdle()) {
      console.log('idlePoll: entering idle mode');
    }
  }

  /**
   * Forcibly set us as idle.
   */
  export function set(): void {
    var wasIdle = isIdle();

    // a zero time here will cause idle to start immediately
    idleTimeLimit = 0;

    if (!wasIdle && isIdle()) {
      console.log('idleSet: entering idle mode');
      onPause();
    }
  }

  /**
   * Forcibly set us as no longer idle.
   */
  export function reset(): void {
    // update immediately when the user comes back
    if (isIdle()) {
      console.log('idleReset: leaving idle mode');
      idleTime = 0;
      onResume();
    }
    idleTime = 0;
    idleTimeLimit = MAX_IDLE_TIME;
  }

  /**
   * Callback for mouse movement event, to check if this is real activity.
   *
   * @param e The event details.
   */
  function mousemove(e: JQueryMouseEventObject): void {
    var dX = lastMouseX - e.clientX;
    var dY = lastMouseY - e.clientY;
    var deltaSquared = dX * dX + dY * dY;
    // only treat movements over 3 pixels as enough to reset us
    if (deltaSquared > 3 * 3) {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      reset();
    }
  }

  /**
   * Register a function to be run when we go idle.
   *
   * @param fn The function to be called.
   */
  export function addPauseFunction(fn: () => void): void {
    pauseFunctions.push(fn);
  }

  /**
   * Register a function to be run when we return from being idle.
   *
   * @param fn The function to be called.
   */
  export function addResumeFunction(fn: () => void): void {
    resumeFunctions.push(fn);
  }

  /**
   * Run pause callbacks.
   */
  function onPause(): void {
    pauseFunctions.forEach(function(f){
      try {
        f();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Run resume callbacks.
   */
  function onResume(): void {
    resumeFunctions.forEach(function(f){
      try {
        f();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Initialize the idleness detection system.
   */
  export function setup(): void {
    $('body')
      .keypress(reset)
      .mousemove(mousemove);

    setInterval(poll, IDLE_POLL_TIME * 1000);
  }
}
