class periodicRefresh {

  static readonly DEFAULT_REFRESH_MINUTES = 60;

  private static _refreshMinutes: number = 0;
  private static _interval: number | null = null;

  static wakeup() : void {
    console.log('periodicRefresh: timer fired - leaving idle mode');
    iitc.idle.reset();
  }

  static get refreshMinutes() {
    return periodicRefresh._refreshMinutes;
  }

  static set refreshMinutes(minutes: number) {
    periodicRefresh._refreshMinutes = minutes;
    if (periodicRefresh._interval) {
      window.clearInterval(periodicRefresh._interval);
    }
    if (minutes > 0) {
      console.warn('Periodic refresh will occur every ' + minutes + ' minutes');
      periodicRefresh._interval = window.setInterval(periodicRefresh.wakeup, minutes * 60 * 1000);
    } else if (periodicRefresh._interval) {
      console.warn('Stopped periodic refresh timer');
      periodicRefresh._interval = null;
    }
  }
}

periodicRefresh.refreshMinutes = periodicRefresh.DEFAULT_REFRESH_MINUTES;

plugin.periodicRefresh = periodicRefresh;
