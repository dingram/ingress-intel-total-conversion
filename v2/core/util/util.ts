/**
 * IITC utility functions.
 */
namespace iitc.util {

  /**
   * Add thousand separators to a number.
   *
   * From http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
   *
   * @param n The number to transform.
   */
  export function digits(n: number): string {
    // U+2009 - Thin Space. Recommended for use as a thousands separator.
    // https://en.wikipedia.org/wiki/Space_(punctuation)#Table_of_spaces
    return (n + '').replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
  }

  /**
   * Zero-pad a number to the given number of digits.
   *
   * @param n   The number to zero-pad.
   * @param pad The desired length.
   * @return The zero-padded string.
   */
  export function zeroPad(n: number, pad: number): string {
    let num = n.toString();
    let zeros = pad - num.length;
    return Array(zeros > 0 ? zeros + 1 : 0).join('0') + num;
  }

  /**
   * Truncate the decimal part from a number.
   *
   * This will change 5.5 to 5 and -5.5 to -5.
   *
   * @param n The number to truncate.
   * @return The truncated integer value.
   */
  export function trunc(n: number): number {
    if (n >= 0) {
      return Math.floor(n);
    } else {
      return Math.ceil(n);
    }
  }

  /**
   * Clamp the latitude to the range the projection can handle (approx 85°N/S).
   *
   * @param lat The latitude to clamp.
   * @return The clamped value.
   */
  export function clampLat(lat: number): number {
    // the map projection used does not handle above approx +- 85 degrees north/south of the equator
    if (lat > 85.051128) {
      lat = 85.051128;
    } else if (lat < -85.051128) {
      lat = -85.051128;
    }
    return lat;
  }

  /**
   * Clamp the longitude to the range the projection can handle (180°E/W).
   *
   * @param lng The longitude to clamp.
   * @return The clamped value.
   */
  export function clampLng(lng: number): number {
    if (lng > 179.999999) {
      lng = 179.999999;
    } else if (lng < -180.0) {
      lng = -180.0;
    }
    return lng;
  }

  /**
   * Clamp the LatLng to the range the projection can handle.
   *
   * @param latlng The LatLng to clamp.
   * @return The clamped value.
   */
  export function clampLatLng(latlng: L.LatLng): L.LatLng {
    return new L.LatLng(
      clampLat(latlng.lat),
      clampLng(latlng.lng)
    );
  }

  /**
   * Clamp the LatLngBounds to the range the projection can handle.
   *
   * @param latlng The LatLngBounds to clamp.
   * @return The clamped value.
   */
  export function clampLatLngBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    return new L.LatLngBounds(
      clampLatLng(bounds.getSouthWest()),
      clampLatLng(bounds.getNorthEast())
    );
  }

}
