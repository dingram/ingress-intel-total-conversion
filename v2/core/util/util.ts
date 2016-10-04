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
   * @param pad The desired 
   */
  export function zeroPad(n: number, pad: number) {
    let num = n.toString();
    let zeros = pad - num.length;
    return Array(zeros > 0 ? zeros + 1 : 0).join('0') + num;
  }

}
