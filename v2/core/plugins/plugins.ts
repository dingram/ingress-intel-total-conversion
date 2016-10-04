namespace iitc.plugins {
  var _plugin: any = {};

  export class PluginManager {
    private _initialized = false;

    constructor(private plugins: IITCPlugin[]) {
    }

    private pluginName(plugin: IITCPlugin) {
      if (plugin && plugin.info && plugin.info.script && plugin.info.script.name) {
        return plugin.info.script.name;
      }
      return '[unknown]';
    }

    private initPlugin(plugin: IITCPlugin) {
      let plugin_name: string = this.pluginName(plugin);
      console.log('PluginManager: Initializing plugin ' + plugin_name);
      try {
        plugin(window.plugin);
      } catch (e) {
        console.error('Failed to initialize plugin ' + plugin_name + ': ' + e);
      }
    }

    public init() {
      // initialize plugins
      if (!window.plugin) {
        Object.defineProperty(window, "plugin", {
            get: function () {
              return _plugin;
            },
            set: function (v: any) {
              if (typeof v == 'function') {
                for (let k in v) {
                  throw new Error('Disallowing attempt to set window.plugin to a function object with properties');
                }
                return;
              }
              throw new Error('Disallowing attempt to set window.plugin');
            },
            enumerable: true,
            configurable: false,
        });
      }
      if (this._initialized) {
        throw new Error('PluginManager is already initialized');
      }
      if (this.plugins) {
        console.log('PluginManager: Initializing existing plugins…');
        for (let plugin of this.plugins) {
          this.initPlugin(plugin);
        }
        console.log('PluginManager: Initialization complete.');
      }
      this._initialized = true;
    }

    public push(plugin: IITCPlugin) {
      this.plugins.push(plugin);
      this.initPlugin(plugin);
    }
  }

  export function setup() {
    // TODO: cope with legacy plugins in bootPlugins
    let plugin_list: IITCPlugin[] = [];
    if (typeof window.iitc_plugins !== 'undefined') {
      plugin_list = window.iitc_plugins;
    }
    delete window.iitc_plugins;
    let _pluginManager = new PluginManager(plugin_list);
    Object.defineProperty(window, "iitc_plugins", {
        get: function () {
            return _pluginManager;
        },
        enumerable: true,
        configurable: false,
    });
    _pluginManager.init();
  }
}
