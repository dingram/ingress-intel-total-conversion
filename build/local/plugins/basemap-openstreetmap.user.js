// ==UserScript==
// @id             iitc-plugin-basemap-openstreetpam@jonatkins
// @name           IITC plugin: OpenStreetMap.org map tiles
// @category       Map Tiles
// @version        0.1.1.20161015.53955
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-10-15-053955] Add the native OpenStreetMap.org map tiles as an optional layer.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20161015.53955';
plugin_info.pluginId = 'basemap-openstreetmap';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileOpenStreetMap = {
  addLayer: function() {
    // OpenStreetMap tiles - we shouldn't use these by default - https://wiki.openstreetmap.org/wiki/Tile_usage_policy
    // "Heavy use (e.g. distributing an app that uses tiles from openstreetmap.org) is forbidden without prior permission from the System Administrators"

    var osmOpt = {
      attribution: 'Map data © OpenStreetMap contributors',
      maxNativeZoom: 18,
      maxZoom: 21,
    };

    var layers = {
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png': 'OpenStreetMap',
      'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png': 'Humanitarian',
    };

    for(var url in layers) {
      var layer = new L.TileLayer(url, osmOpt);
      layerChooser.addBaseLayer(layer, layers[url]);
    }
  },
};

var setup =  window.plugin.mapTileOpenStreetMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


