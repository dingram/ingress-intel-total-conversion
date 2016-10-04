function wrapper(plugin_info) {
// START OF WRAPPER

// Ensure plugin list is there, even if IITC is not yet loaded.
if (typeof window.iitc_plugins === 'undefined') window.iitc_plugins = [];

var setup = function(plugin) {
'@@WRAPPED_CODE@@';
};

var deps = '@@PLUGIN_DEPS@@';
setup.dependencies = deps ? deps.split(',') : [];
setup.info = plugin_info;

// If IITC has booted, setup will automatically get run by magic.
window.iitc_plugins.push(setup);

// END OF WRAPPER
}

// Prepare script information.
var info = {};
if (GM_info && GM_info.script) {
  info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
  };
}

// Stringify the wrapper, inject it into the page, and immediately execute.
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
