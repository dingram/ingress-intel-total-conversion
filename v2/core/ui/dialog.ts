/**
 * IITC Dialog code and helpers.
 */
namespace iitc.ui.dialog {
  /** Latest dialog ID? */
  let dialog_id: number = 0;
  /** All dialogs currently open? */
  let dialogs: Array<string> = [];
  /** Count of dialogs currently open? */
  let dialog_count: number = 0;
  /** The dialog with focus? */
  //let dialog_focus: number = 0;

  /**
   * Show a dialog with the given options.
   */
  export function show(options: DialogOptions): void {
    let opts: ImmutableDialogOptions = initialize(options);
    dialogs.push(opts.id);
    dialog_count++;
  }

  export function close(): void {
    dialog_count--;
  }

  export interface DialogOptions {
    class?: string;
    draggable?: boolean;
    id?: string;
    html?: string;
    modal?: boolean;
    text?: string;
    title: string;
    width?: number;
  }

  interface ImmutableDialogOptions extends DialogOptions {
    readonly class: string;
    readonly draggable: boolean;
    readonly id: string;
    readonly html: string;
    readonly modal: boolean;
    readonly text: string;
    readonly title: string;
    readonly width: number;
  }

  function initialize(options: DialogOptions): ImmutableDialogOptions {
    // all optional properties must have a default
    let defaults: DialogOptions = {
      class: '',
      draggable: true,
      id: '',
      html: '',
      modal: /*iitc.isMobile*/ false,
      text: '',
      title: '',
      width: 500
    }

    // hijack id
    options.id = 'dialog-' + (options.modal ? 'modal' : (options.id ? options.id : 'anon-' + dialog_id++));

    // ensure either html or text is provided
    if (typeof options.html === 'undefined') {
      if (typeof options.text === 'undefined') {
        console.error('iitc.ui.dialog.show: no text in dialog ' + options.id);
        options.html = iitc.util.convertTextToTableMagic('');
      }
      else
        options.html = iitc.util.convertTextToTableMagic(options.text);
    }

    // modal dialogs should not be draggable
    if (options.modal) {
      if (typeof options.class == 'undefined') {
        options.class = '';
      }
      options.class = (options.class ? options.class + ' ' : '') + 'ui-dialog-modal';
      options.draggable = false;
    }

    // merge defaults and provided options
    let opts: ImmutableDialogOptions = $.extend({}, defaults, options);

    return opts;
  }
}
