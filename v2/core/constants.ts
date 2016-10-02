namespace iitc {
  export const REFRESH_INTERVAL = 30;
  export const COLORS = ['#FF6600', '#0088FF', '#03DC03']; // none, res, enl

  export const TEAM_NONE = 0;
  export const TEAM_RES = 1;
  export const TEAM_ENL = 2;
  export const TEAM_TO_CSS = ['none', 'res', 'enl'];

  export const SLOT_TO_LAT = [0, Math.sqrt(2)/2, 1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2];
  export const SLOT_TO_LNG = [1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2];
  export const EARTH_RADIUS = 6378137;
  export const DEG2RAD = Math.PI / 180;

  export const MIN_ZOOM = 3;

  export const DEFAULT_PORTAL_IMG = '//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png';
}
