/**
 * The IITC plugin management subsystem.
 */
namespace iitc.plugins {
  /** The holder for window.plugin, used to keep it protected against accidental clearing. */
  var _plugin: any = {};

  /**
   * The IITC plugin loader and manager.
   *
   * TODO: handle plugin dependencies.
   */
  export class PluginManager implements IITCPluginManager {
    /** Whether or not this plugin manager has been initialized yet. */
    private _initialized = false;

    /**
     * Create a plugin manager instance.
     *
     * @param plugins The initial set of plugins to load, if any.
     */
    constructor(private plugins: IITCPlugin[]) {
    }

    /**
     * Get the number of plugins in this manager.
     */
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
      try {
        if (plugin.legacy) {
          console.warn('PluginManager: Initializing legacy plugin "' + plugin_name + '"');
          plugin();
        } else {
          console.log('PluginManager: Initializing plugin "' + plugin_name + '"');
          plugin(window.plugin);
        }
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
    public init(): void {
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
      if (this.plugins && this.plugins.length) {
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
        if (this._initialized) {
          this.initPlugin(plugin);
        }
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
   * Manager for legacy plugins, atop the main plugin manager.
   */
  export class LegacyPluginManager implements IITCPluginManager {
    /** Whether or not this plugin manager has been initialized yet. */
    private _initialized = false;

    /**
     * Create a plugin manager instance.
     *
     * @param manager The upstream plugin manager to delegate to.
     * @param plugins The initial set of plugins to load, if any.
     */
    constructor(private manager: PluginManager, private plugins: IITCPlugin[]) {
    }

    /**
     * Get the number of plugins in this manager.
     */
    get length(): number {
      return this.plugins.length;
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
    public init(): void {
      if (this._initialized) {
        throw new Error('LegacyPluginManager is already initialized');
      }

      // Prepare any pending plugins.
      if (this.plugins && this.plugins.length) {
        console.log('LegacyPluginManager: Preparing existing plugins…');
        for (let plugin of this.plugins) {
          plugin.legacy = true;
          this.manager.push(plugin);
        }
        console.log('LegacyPluginManager: Preparing complete.');
      }

      this.manager.init();
      this._initialized = true;
    }

    /**
     * Add a new plugin and immediately initialize it.
     *
     * @param plugins The new plugin(s) to add.
     */
    public push(...plugins: IITCPlugin[]): number {
      for (let plugin of plugins) {
        plugin.legacy = true;
      }
      return this.manager.push(...plugins);
    }

    public toString(): string {
      return this.manager.toString();
    }

    public toLocaleString(): string {
      return this.manager.toLocaleString();
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
    let legacy_plugins: IITCPlugin[] = [];

    // Grab existing plugin list that might have been written before IITC
    // booted.
    if (typeof window.iitc_plugins !== 'undefined') {
      plugin_list = window.iitc_plugins;
    }
    if (typeof window.bootPlugins !== 'undefined') {
      legacy_plugins = window.bootPlugins;
    }

    // Set up plugin managers.
    let pluginManager = new PluginManager(plugin_list);
    let legacyPluginManager = new LegacyPluginManager(pluginManager,
                                                      legacy_plugins);

    // Replace window.iitc_plugins with plugin manager and protect it.
    delete window.iitc_plugins;
    Object.defineProperty(window, 'iitc_plugins', {
        get: function () {
          return pluginManager;
        },
        enumerable: true,
        configurable: false,
    });

    // Replace window.bootPlugins with plugin manager and protect it.
    delete window.bootPlugins;
    Object.defineProperty(window, 'bootPlugins', {
        get: function () {
          return legacyPluginManager;
        },
        enumerable: true,
        configurable: false,
    });

    // Initialize the plugin managers. This will also initialize the wrapped
    // non-legacy plugin manager.
    legacyPluginManager.init();
  }
}
