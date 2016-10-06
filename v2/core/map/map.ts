/**
 * The IITC map and renderer.
 */
namespace iitc.map {
  /** The map object itself. */
  export var map: L.Map;

  export var layerChooser: L.Control.Layers;

  export var portalsFactionLayers: L.LayerGroup<L.ILayer>[][] = [];
  export var linksFactionLayers: L.LayerGroup<L.ILayer>[] = [];
  export var fieldsFactionLayers: L.LayerGroup<L.ILayer>[] = [];

  /**
   * Set up the map.
   */
  export function setup() {
    setupMapElement();
    setupMapLayers();
  }

  function setupMapElement() {
    $('#map').text('');

    // proper initial position is now delayed until all plugins are loaded and the base layer is set
    map = new L.Map('map', {
      center: new L.LatLng(0, 0),
      zoom: 1,
      // zoomControl: (typeof android !== 'undefined' && android && android.showZoom) ? android.showZoom() : true,
      zoomControl: true,
      minZoom: iitc.MIN_ZOOM,
      // zoomAnimation: false,
      markerZoomAnimation: false,
      bounceAtZoomLimits: false
    });

    if (L.Path.CANVAS) {
      // for canvas, 2% overdraw only - to help performance
      L.Path.CLIP_PADDING = 0.02;
    } else if (L.Path.SVG) {
      if (L.Browser.mobile) {
        // mobile SVG - 10% ovredraw. might help performance?
        L.Path.CLIP_PADDING = 0.1;
      } else {
        // for svg, 100% overdraw - so we have a full screen worth in all directions
        L.Path.CLIP_PADDING = 1.0;
      }
    }

    // add empty div to leaflet control areas - to force other leaflet controls to move around IITC UI elements
    // TODO? move the actual IITC DOM into the leaflet control areas, so dummy <div>s aren't needed
    if (true /*!isSmartphone()*/) {
      // chat window area
      $(map._controlCorners['bottomleft']).append(
        $('<div>').width(708).height(108).addClass('leaflet-control').css({'pointer-events': 'none', 'margin': '0'}));
    }
  }

  function setupMapLayers() {
    var addLayers = {};
    var hiddenLayer: L.LayerGroup<L.ILayer>[] = [];

    portalsFactionLayers = [];
    var portalsLayers: L.LayerGroup<L.ILayer>[] = [];
    for(var i = 0; i <= 8; i++) {
      portalsFactionLayers[i] = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
      portalsLayers[i] = L.layerGroup(portalsFactionLayers[i]);
      map.addLayer(portalsLayers[i]);
      var t = (i === 0 ? 'Unclaimed/Placeholder' : 'Level ' + i) + ' Portals';
      addLayers[t] = portalsLayers[i];
      // Store it in hiddenLayer to remove later
      if(!isLayerGroupDisplayed(t, true)) hiddenLayer.push(portalsLayers[i]);
    }

    fieldsFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    var fieldsLayer = L.layerGroup(fieldsFactionLayers);
    map.addLayer(fieldsLayer, true);
    addLayers['Fields'] = fieldsLayer;
    // Store it in hiddenLayer to remove later
    if(!isLayerGroupDisplayed('Fields', true)) hiddenLayer.push(fieldsLayer);

    linksFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    var linksLayer = L.layerGroup(linksFactionLayers);
    map.addLayer(linksLayer, true);
    addLayers['Links'] = linksLayer;
    // Store it in hiddenLayer to remove later
    if(!isLayerGroupDisplayed('Links', true)) hiddenLayer.push(linksLayer);

    // faction-specific layers
    // these layers don't actually contain any data. instead, every time they're added/removed from the map,
    // the matching sub-layers within the above portals/fields/links are added/removed from their parent with
    // the below 'onoverlayadd/onoverlayremove' events
    var factionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    for (var fac in factionLayers) {
      map.addLayer (factionLayers[fac]);
    }

    var setFactionLayersState = function(fac,enabled) {
      if (enabled) {
        if (!fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.addLayer (fieldsFactionLayers[fac]);
        if (!linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.addLayer (linksFactionLayers[fac]);
        for (var lvl in portalsLayers) {
          if (!portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].addLayer (portalsFactionLayers[lvl][fac]);
        }
      } else {
        if (fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.removeLayer (fieldsFactionLayers[fac]);
        if (linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.removeLayer (linksFactionLayers[fac]);
        for (var lvl in portalsLayers) {
          if (portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].removeLayer (portalsFactionLayers[lvl][fac]);
        }
      }
    }

    // to avoid any favouritism, we'll put the player's own faction layer first
    if (PLAYER.team == 'RESISTANCE') {
      addLayers['Resistance'] = factionLayers[iitc.TEAM_RES];
      addLayers['Enlightened'] = factionLayers[iitc.TEAM_ENL];
    } else {
      addLayers['Enlightened'] = factionLayers[iitc.TEAM_ENL];
      addLayers['Resistance'] = factionLayers[iitc.TEAM_RES];
    }
    if (!isLayerGroupDisplayed('Resistance', true)) hiddenLayer.push (factionLayers[iitc.TEAM_RES]);
    if (!isLayerGroupDisplayed('Enlightened', true)) hiddenLayer.push (factionLayers[iitc.TEAM_ENL]);

    setFactionLayersState (iitc.TEAM_NONE, true);
    setFactionLayersState (iitc.TEAM_RES, isLayerGroupDisplayed('Resistance', true));
    setFactionLayersState (iitc.TEAM_ENL, isLayerGroupDisplayed('Enlightened', true));

    // NOTE: these events are fired by the layer chooser, so won't happen until that's created and added to the map
    map.on('overlayadd overlayremove', function(e: L.LeafletLayersControlEvent) {
      var displayed = (e.type == 'overlayadd');
      switch (e.name) {
        case 'Resistance':
          setFactionLayersState(iitc.TEAM_RES, displayed);
          break;
        case 'Enlightened':
          setFactionLayersState(iitc.TEAM_ENL, displayed);
          break;
      }
    });

    var baseLayers = createDefaultBaseMapLayers();

    layerChooser = new L.Control.Layers(baseLayers, addLayers);

    // Remove the hidden layer after layerChooser built, to avoid messing up ordering of layers 
    $.each(hiddenLayer, function(ind, layer){
      map.removeLayer(layer);

      // as users often become confused if they accidentally switch a standard layer off, display a warning in this case
      $('#portaldetails').html('<div class="layer_off_warning">'
                              +'<p><b>Warning</b>: some of the standard layers are turned off. Some portals/links/fields will not be visible.</p>'
                              +'<a id="enable_standard_layers">Enable standard layers</a>'
                              +'</div>');

      $('#enable_standard_layers').on('click', function() {
        $.each(addLayers, function(ind, layer) {
          if (!map.hasLayer(layer)) map.addLayer(layer);
        });
        $('#portaldetails').html('');
      });

    });

    map.addControl(layerChooser);

    map.attributionControl.setPrefix('');

    // listen for changes and store them in cookies
    map.on('moveend', storePosition);

    map.on('moveend', function(e) {
      // two limits on map position
      // we wrap longitude (the L.LatLng 'wrap' method) - so we don't find ourselves looking beyond +-180 degrees
      // then latitude is clamped with the clampLatLng function (to the 85 deg north/south limits)
      var newPos = iitc.util.clampLatLng(map.getCenter().wrap());
      if (!map.getCenter().equals(newPos)) {
        map.panTo(newPos,{animate:false})
      }
    });

    /*
    // map update status handling & update map hooks
    // ensures order of calls
    map.on('movestart', function() { window.mapRunsUserAction = true; window.requests.abort(); window.startRefreshTimeout(-1); });
    map.on('moveend', function() { window.mapRunsUserAction = false; window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });
     */

    map.on('zoomend', setDisabledLayerStates);
    setDisabledLayerStates();

    // on zoomend, check to see the zoom level is an int, and reset the view if not
    // (there's a bug on mobile where zoom levels sometimes end up as fractional levels. this causes the base map to be invisible)
    map.on('zoomend', function() {
      var z = map.getZoom();
      if (z != iitc.util.trunc(z))
      {
        console.warn('Non-integer zoom level at zoomend: '+z+' - trying to fix...');
        map.setZoom(iitc.util.trunc(z), {animate:false});
      }
    });


    // set a 'moveend' handler for the map to clear idle state. e.g. after mobile 'my location' is used.
    // possibly some cases when resizing desktop browser too
    map.on('moveend', iitc.idle.reset);

    /*
    iitc.idle.addResumeFunction(function() { window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });
     */

    /*
    // create the map data requester
    window.mapDataRequest = new MapDataRequest();
    window.mapDataRequest.start();

    // start the refresh process with a small timeout, so the first data request happens quickly
    // (the code originally called the request function directly, and triggered a normal delay for the next refresh.
    //  however, the moveend/zoomend gets triggered on map load, causing a duplicate refresh. this helps prevent that
    window.startRefreshTimeout(ON_MOVE_REFRESH*1000);
     */
  }

  export function isLayerGroupDisplayed(name: string, b: boolean) {
  }

  export function storePosition() {
  }

  export function setDisabledLayerStates() {
  }

  function createDefaultBaseMapLayers() {
    var baseLayers = {};

    // cartodb has some nice tiles too - both dark and light subtle maps - http://cartodb.com/basemaps/
    // (not available over https though - not on the right domain name anyway)
    var cartoAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>';
    var cartoUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/{theme}/{z}/{x}/{y}.png';
    baseLayers['CartoDB Dark Matter'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_all'});
    baseLayers['CartoDB Positron'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_all'});

    /*
    // we'll include Google maps too - in the ingress default style, and a few other standard ones
    // as the stock intel map already uses the Google maps API, we just hijack their inclusion of the javascript and API key :)
    var ingressGMapOptions = {
      backgroundColor: '#0e3d4e', //or #dddddd ? - that's the Google tile layer default
      styles: [
          { featureType:"all", elementType:"all",
            stylers: [{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}] },
          { featureType:"water", elementType:"all",
            stylers: [{visibility:"on"}, {hue:"#005eff"}, {invert_lightness:true}] },
          { featureType:"poi", stylers:[{visibility:"off"}]},
          { featureType:"transit", elementType:"all", stylers:[{visibility:"off"}] }
        ]
    };
    baseLayers['Google Default Ingress Map'] = new L.Google('ROADMAP',{maxZoom:21, mapOptions:ingressGMapOptions});
    baseLayers['Google Roads'] = new L.Google('ROADMAP',{maxZoom:21});
    baseLayers['Google Satellite'] = new L.Google('SATELLITE',{maxZoom:21});
    baseLayers['Google Hybrid'] = new L.Google('HYBRID',{maxZoom:21});
    baseLayers['Google Terrain'] = new L.Google('TERRAIN',{maxZoom:15});
     */

    return baseLayers;
  }

  export function setBaseLayer() {
    //create a map name -> layer mapping - depends on internals of L.Control.Layers
    var nameToLayer = {};
    var firstLayer = null;

    for (let i in layerChooser._layers) {
      var obj = layerChooser._layers[i];
      if (!obj.overlay) {
        nameToLayer[obj.name] = obj.layer;
        if (!firstLayer) firstLayer = obj.layer;
      }
    }

    var baseLayer = nameToLayer[localStorage['iitc-base-map']] || firstLayer;
    map.addLayer(baseLayer);

    // now we have a base layer we can set the map position
    // (setting an initial position, before a base layer is added, causes issues with leaflet)
    var pos = {center: new L.LatLng(0.0, 0.0), zoom: 1}; //getPosition();
    map.setView (pos.center, pos.zoom, {reset:true});


    //event to track layer changes and store the name
    map.on('baselayerchange', function(info: L.LeafletLayerEvent) {
      for(let i in layerChooser._layers) {
        var obj = layerChooser._layers[i];
        if (info.layer === obj.layer) {
          localStorage['iitc-base-map'] = obj.name;
          break;
        }
      }

      //also, leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
      map.setZoom(map.getZoom());
    });

  }
}
