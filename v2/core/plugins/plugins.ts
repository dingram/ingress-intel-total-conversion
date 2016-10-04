/**
 * The IITC plugin management subsystem.
 */
namespace iitc.plugins {
  /** The holder for window.plugin, used to keep it protected against accidental clearing. */
  var _plugin: any = {};

  /**
   * The IITC plugin loader and manager.
   */
  export class PluginManager {
    /** Whether or not this plugin manager has been initialized yet. */
    private _initialized = false;

    /**
     * Create a plugin manager instance.
     *
     * @param plugins The initial set of plugins to load, if any.
     */
    constructor(private plugins: IITCPlugin[]) {
    }

    get length(): number {
      return this.plugins.length;
    }

    /**
     * Return the display name associated with a plugin.
     *
     * @param plugin The plugin to fetch the display name for.
     */
    private pluginDisplayName(plugin: IITCPlugin) {
      if (plugin && plugin.info && plugin.info.script && plugin.info.script.name) {
        return plugin.info.script.name;
      }
      return '[unknown]';
    }

    /**
     * Initialize the given plugin.
     *
     * @param plugin The plugin to initialize.
     */
    private initPlugin(plugin: IITCPlugin) {
      let plugin_name: string = this.pluginDisplayName(plugin);
      console.log('PluginManager: Initializing plugin "' + plugin_name + '"');
      try {
        plugin(window.plugin);
      } catch (e) {
        console.error('Failed to initialize plugin "' + plugin_name + '": ' + e);
      }
    }

    /**
     * Set up the plugin environment, then actually load and initialize any
     * pending plugins.
     *
     * As a side-effect, we replace window.plugin with an unoverwritable
     * object, so that badly-written plugins can't clobber it with code like:
     *
     *     if (typeof window.plugin !== 'function') window.plugin = function(){};
     *
     * This is because there is absolutely no reason for it to need to be a
     * function and suffer the extra (slight) overhead.
     */
    public init() {
      if (this._initialized) {
        throw new Error('PluginManager is already initialized');
      }

      if (window.plugin) {
        // Save the existing contents.
        _plugin = window.plugin;
      }

      // Protect window.plugin from being overwritten.
      Object.defineProperty(window, 'plugin', {
          get: function () {
            return _plugin;
          },
          set: function (v: any) {
            if (typeof v == 'function') {
              for (let k in v) {
                k;
                throw new Error('Disallowing attempt to set window.plugin to a function object with properties');
              }
              return;
            }
            throw new Error('Disallowing attempt to set window.plugin');
          },
          enumerable: true,
          configurable: false,
      });

      // Initialize any pending plugins
      if (this.plugins) {
        console.log('PluginManager: Initializing existing plugins…');
        for (let plugin of this.plugins) {
          this.initPlugin(plugin);
        }
        console.log('PluginManager: Initialization complete.');
      }
      this._initialized = true;
    }

    /**
     * Add a new plugin and immediately initialize it.
     *
     * @param plugins The new plugin(s) to add.
     */
    public push(...plugins: IITCPlugin[]): number {
      for (let plugin of plugins) {
        this.plugins.push(plugin);
        this.initPlugin(plugin);
      }
      return this.length;
    }

    public toString(): string {
      return this.plugins.toString();
    }

    public toLocaleString(): string {
      return this.plugins.toLocaleString();
    }

  }

  /**
   * Set up the plugin management system.
   *
   * Note that we overwrite window.iitc_plugins with the plugin manager, which
   * looks a bit like an array if you squint. It
   */
  export function setup() {
    // TODO: cope with legacy plugins in bootPlugins
    let plugin_list: IITCPlugin[] = [];
    if (typeof window.iitc_plugins !== 'undefined') {
      plugin_list = window.iitc_plugins;
    }
    delete window.iitc_plugins;
    let _pluginManager = new PluginManager(plugin_list);
    Object.defineProperty(window, 'iitc_plugins', {
        get: function () {
            return _pluginManager;
        },
        enumerable: true,
        configurable: false,
    });
    _pluginManager.init();
  }
}
