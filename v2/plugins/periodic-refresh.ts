namespace periodicRefresh {

  export function wakeup() : void {
    console.log('periodicRefresh: timer fired - leaving idle mode');
    //iitc.util.idleReset();
  }

  export const refreshMinutes = 60;

  window.setInterval(wakeup, refreshMinutes * 60 * 1000);

}

(window.plugin || (window.plugin = {})).periodicRefresh = periodicRefresh;
