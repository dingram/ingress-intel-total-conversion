namespace iitc.idle {
  export const MAX_IDLE_TIME = 15 * 60;
  export const IDLE_POLL_TIME = 10;

  export var idleTime: number = 0;
  var idleTimeLimit: number = MAX_IDLE_TIME;
  var pauseFunctions: (() => void)[] = [];
  var resumeFunctions: (() => void)[] = [];
  var lastMouseX: number = 0;
  var lastMouseY: number = 0;

  export function isIdle(): boolean {
    return idleTime >= idleTimeLimit;
  }

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

  export function set(): void {
    var wasIdle = isIdle();

    // a zero time here will cause idle to start immediately
    idleTimeLimit = 0;

    if (!wasIdle && isIdle()) {
      console.log('idleSet: entering idle mode');
      onPause();
    }
  }

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

  export function addPauseFunction(fn: () => void): void {
    pauseFunctions.push(fn);
  }

  export function addResumeFunction(fn: () => void): void {
    resumeFunctions.push(fn);
  }

  function onPause(): void {
    pauseFunctions.forEach(function(f){
      try {
        f();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function onResume(): void {
    resumeFunctions.forEach(function(f){
      try {
        f();
      } catch (e) {
        console.error(e);
      }
    });
  }

  export function setup(): void {
    $('body')
      .keypress(reset)
      .mousemove(mousemove);

    setInterval(poll, IDLE_POLL_TIME * 1000);
  }
}
