namespace iitc.map {
  export var map: L.Map;

  export function setup() {
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

    map.attributionControl.setPrefix('');


  }

}
