/**
 * IITC utility functions.
 */
namespace iitc.util {

  export function convertTextToTableMagic(text: string): string {
    // check if it should be converted to a table
    if(!text.match(/\t/)) return text.replace(/\n/g, '<br>');

    let data: Array<Array<string>> = [];
    let columnCount: number = 0;

    // parse data
    let rows: Array<string> = text.split('\n');
    $.each(rows, function(i, row) {
      data[i] = row.split('\t');
      if(data[i].length > columnCount) columnCount = data[i].length;
    });

    // build the table
    let table: string = '<table>';
    $.each(data, function(i) {
      table += '<tr>';
      $.each(data[i], function(k, cell) {
        let attributes: string = '';
        if(k === 0 && data[i].length < columnCount) {
          attributes = ' colspan="'+(columnCount - data[i].length + 1)+'"';
        }
        table += '<td'+attributes+'>'+cell+'</td>';
      });
      table += '</tr>';
    });
    table += '</table>';
    return table;
  }

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
