/**
 * Handy constants.
 */
namespace iitc {
  /** Map refresh interval, in seconds. */
  export const REFRESH_INTERVAL = 30;
  /** Team colors: none, res, enl. */
  export const COLORS = ['#FF6600', '#0088FF', '#03DC03'];

  /** Team NONE array index */
  export const TEAM_NONE = 0;
  /** Team RESISTANCE array index */
  export const TEAM_RES = 1;
  /** Team ENLIGHTENED array index */
  export const TEAM_ENL = 2;
  /** Array for converting a TEAM constant to a CSS class. */
  export const TEAM_TO_CSS = ['none', 'res', 'enl'];

  /** Convert from a resonator slot to a latitude value. */
  export const SLOT_TO_LAT = [0, Math.sqrt(2)/2, 1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2];
  /** Convert from a resonator slot to a longitude value. */
  export const SLOT_TO_LNG = [1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2];
  /** Approximate Earth radius, in meters. */
  export const EARTH_RADIUS = 6378137;
  /** Multiplier to convert from degrees to radians. */
  export const DEG2RAD = Math.PI / 180;

  /** Minimum zoom level for the map. Must match stock. */
  export const MIN_ZOOM = 3;

  /** The default image to show if a portal doesn't have one of its own. */
  export const DEFAULT_PORTAL_IMG = '//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png';
}
