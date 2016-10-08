/**
 * IITC Dialog code and helpers.
 *
 * This rewrite is built upon the work of:
 * - numinit (https://github.com/numinit)
 * - jonatkins (https://github.com/jonatkins)
 * - leCradle (https://github.com/leCradle)
 * - fkloft (https://github.com/fkloft)
 */
namespace iitc.ui.dialog {

  let COUNT: number = 0;
  let DIALOGS: Array<Dialog> = [];
  let FOCUSED: Dialog | undefined = undefined;
  let NEXT_ID: number = 0;
  let SLIDE_DURATION: number = 100;

  /**
   * Represents a visible dialog. Dialogs are displayed atop the map layer.
   */
  export class Dialog {
    
    public readonly $: JQuery;
    public readonly id: string;
    public readonly options: ImmutableDialogOptions;

    /**
     * Create a new Dialog.
     * @constructor
     * @param {ImmutableDialogOptions} options - the options for the Dialog
     */
    constructor(options: ImmutableDialogOptions) {
      this.options = options;
      this.id = options.id;

      $('body').append('<div id="' + this.options.id + '"></div>');
      this.$ = $('#' + this.options.id).dialog(this.options);

      this.$.html(this.options.html);
      this.$.data('id', this.options.id);
      this.$.data('jqID', '#' + this.options.id);
      this.$.data('collapsed', false);
    }

    /**
     * Blur (un-focus) on the Dialog
     */
    public blur(): void {
      if (typeof this.options.blurCallback === "function") {
        $.proxy(this.options.blurCallback, this)();
      }
    }

    /**
     * Close (hide) the Dialog
     */
    public close(): void {
      if (typeof this.options.closeCallback === "function") {
        $.proxy(this.options.closeCallback, this)();
      }
      this.$.dialog('close'); 
    }

    public collapse(): void {
      if (typeof this.options.collapseExpandCallback === "function") {
        $.proxy(this.options.collapseExpandCallback, this)();
      }
      else if (typeof this.options.collapseCallback === "function") {
        $.proxy(this.options.collapseCallback, this)();
      }

      this.$.data('collapsed', true);
    }

    public expand(): void {
      if (typeof this.options.collapseExpandCallback === "function") {
        $.proxy(this.options.collapseExpandCallback, this)();
      }
      else if (typeof this.options.expandCallback === "function") {
        $.proxy(this.options.expandCallback, this)();
      }

      this.$.data('collapsed', false);
    }

    /**
     * Focus on the Dialog
     */
    public focus(): void {
      if (typeof this.options.focusCallback === "function") {
        $.proxy(this.options.focusCallback, this)();
      }
    }

    /**
     * Determins if the Dialog is currently collapsed
     */
    public isCollapsed(): boolean {
      return this.$.data('collapsed') === true;
    }

    /**
     * Open (show) the Dialog
     */
    public open(): void {
      this.$.dialog('open');
    }
  }

  /**
   * Options for a Dialog
   */
  export interface DialogOptions extends JQueryUI.DialogOptions {
    blurCallback?: any;
    closeCallback?: any;
    collapseCallback?: any;
    collapseExpandCallback?: any;
    expandCallback?: any;
    focusCallback?: any;
    html?: string;
    id?: string;
    text?: string;
  }

  /**
   * Options for a Dialog, with required properties marked as read-only
   */
  export interface ImmutableDialogOptions extends DialogOptions {
    readonly id: string;
    readonly html: string;
  }


  /**
   * Create and show a dialog with the given options.
   * @param {DialogOptions} options the options for the Dialog
   */
  export function show(options: DialogOptions): void {
    let dlg: Dialog = create(options);
    dlg.open();
  }

  /**
   * Create, but do not show, a dialog with the given options.
   * @param {DialogOptions} options - the options for the Dialog
   */
  function create(options: DialogOptions): Dialog {
    let opts: ImmutableDialogOptions = initialize(options);
    let dlg: Dialog = new Dialog(opts);

    DIALOGS[opts.id] = dlg;
    COUNT++;

    return dlg;
  }

  /**
   * Gets a Dialog Object from its ID
   * @param {string} id - The ID
   */
  export function get(id: string): Dialog {
    if (DIALOGS[id]) {
      return DIALOGS[id];
    }
    else {
      throw 'iitc.ui.dialog: Cannot get dialog ' + id + ', not found';
    }
  }

  /**
   * Create an ImmutableDialogOptions object consisting of the provided values overlapped with default values.
   * @param {DialogOptions} options - the options for the Dialog.
   */
  function initialize(options: DialogOptions): ImmutableDialogOptions {
    // all properties must have a default
    let defaults: ImmutableDialogOptions = {
      autoOpen: false,
      buttons: {
        'OK': (event: Event) => {
          $(event.target).closest('.ui-dialog').find('.ui-dialog-content').dialog('close');
        }
      },
      close: (event: Event, ui) => {
        if (DIALOGS[(event.target as HTMLElement).id]) {
          try {
            DIALOGS[(event.target as HTMLElement).id].close();
            $(event.target as HTMLElement).remove();
            delete DIALOGS[(event.target as HTMLElement).id];
            COUNT--;
            console.log('iitc.ui.dialog: ' + (event.target as HTMLElement).id + ' closed. ' + COUNT + ' remain');
          }
          catch (err) {
            console.error('iitc.ui.dialog: tried to close non-existent dialog ' + (event.target as HTMLElement).id);
          }
        }
      },
      closeText: 'X',
      dialogClass: '',
      draggable: true,
      focus: (event: Event, ui) => {
        let dlg: Dialog = get((event.target as HTMLElement).id);

        if (FOCUSED !== dlg || FOCUSED === undefined) {
          if (FOCUSED !== undefined) {
            FOCUSED.blur();
          }
          FOCUSED = dlg;
          dlg.focus();

          console.log('iitc.ui.dialog: focused on ' + FOCUSED.id);
        }
      },
      id: '',
      html: '',
      modal: /*iitc.isMobile*/ false,
      open: (event: Event, ui) => {
        let dlg: Dialog = get((event.target as HTMLElement).id);
        let titlebar: JQuery = $(event.target as HTMLElement).closest('.ui-dialog').find('.ui-dialog-titlebar');
        let close: JQuery = titlebar.find('.ui-dialog-titlebar-close');

        // TODO: Collapsing a dialog is broken
        /*    
        if (!dlg.options.modal) {
          let collapse: JQuery = close.clone().css('left', '25px');
          collapse.addClass('ui-icon-triangle-1-n ui-dialog-titlebar-button-collapse ui-dialog-titlebar-collapse-button-expanded');

          let sizeFix: Function = (dlg: Dialog) => {
            console.log("sizefix");
            if (dlg.isCollapsed()) {
              console.log("collapsed");
              dlg.$.dialog('option', 'height', dlg.options.height);
              dlg.$.dialog('option', 'width', dlg.options.width);
            }
          };

          collapse.click($.proxy(function() {
            dlg.$.css('height', '');
            dlg.$.closest('.ui-dialog').find('.ui-dialog-content, .ui-dialog-buttonpane')
                 .slideToggle({duration: SLIDE_DURATION, complete: sizeFix(dlg)});

            if (dlg.isCollapsed()) {
              dlg.expand();
            }
            else {
              dlg.collapse();
            }
          }, this));

          titlebar.prepend(collapse);
        }
        */

        titlebar.find('.ui-dialog-title').addClass('ui-dialog-title-active');
        close.removeAttr('title').addClass('ui-dialog-titlebar-button');

        console.log('iitc.ui.dialog: ' + (event.target as HTMLElement).id + ' opened. ' + COUNT + ' remain');
      },
      text: '',
      title: '',
      width: 500
    }
  
    // hijack id
    options.id = 'dialog-' + (options.modal ? 'modal' : (options.id ? options.id : 'anon-' + NEXT_ID++));
  
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
      if (typeof options.dialogClass == 'undefined') {
        options.dialogClass = '';
      }
      options.dialogClass = (options.dialogClass ? options.dialogClass + ' ' : '') + 'ui-dialog-modal';
      options.draggable = false;
    }
  
    // merge defaults and provided options
    let opts: ImmutableDialogOptions = $.extend({}, defaults, options);
  
    return opts;
  }
}
