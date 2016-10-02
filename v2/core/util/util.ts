namespace iitc.util {

  // Add thousand separators to given number.
  // From http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
  export function digits(n: number): string {
    // U+2009 - Thin Space. Recommended for use as a thousands separator...
    // https://en.wikipedia.org/wiki/Space_(punctuation)#Table_of_spaces
    return (n+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1\u2009");
  }

  export function zeroPad(n: number, pad: number) {
    let num = n.toString();
    let zeros = pad - num.length;
    return Array(zeros>0?zeros+1:0).join("0") + num;
  }

}
