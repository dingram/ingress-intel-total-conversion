namespace iitc {
  export const buildDate = '@@BUILDDATE@@';
}

namespace iitc.bootstrap {
  const JQUERY_VERSION = '2.1.3';
  const JQUERY_UI_VERSION = '1.11.3';
  const LEAFLET_VERSION = '0.7.4';

  // NOTE: no protocol - uses http or https as used on the current page
  const JQUERY = `//ajax.googleapis.com/ajax/libs/jquery/${JQUERY_VERSION}/jquery.min.js`;
  const JQUERY_UI = `//ajax.googleapis.com/ajax/libs/jqueryui/${JQUERY_UI_VERSION}/jquery-ui.min.js`;
  const LEAFLET = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

  export function init() : void {
    console.log("Let's get this show on the road!");
    replacePageContent();
    loadExternalScripts();
  }

  function replacePageContent() : void {
    // Remove complete page. We only wanted the user-data and the page's
    // security context so we can access the API easily. Setup as much as
    // possible without requiring scripts.
    document.getElementsByTagName('head')[0].innerHTML = ''
      + '<title>Ingress Intel Map</title>'
      + '<style>@@INCLUDESTRING:style.css@@</style>'
      + `<link rel="stylesheet" type="text/css" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"/>`
      + '<link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Roboto:100,100italic,300,300italic,400,400italic,500,500italic,700,700italic&subset=latin,cyrillic-ext,greek-ext,greek,vietnamese,latin-ext,cyrillic"/>';


    document.getElementsByTagName('body')[0].innerHTML = ''
      + '<div id="map">Loading, please wait</div>'
      + '<div id="chatcontrols" style="display:none">'
      + '<a accesskey="0" title="[0]"><span class="toggle expand"></span></a>'
      + '<a accesskey="1" title="[1]">all</a>'
      + '<a accesskey="2" title="[2]" class="active">faction</a>'
      + '<a accesskey="3" title="[3]">alerts</a>'
      + '</div>'
      + '<div id="chat" style="display:none">'
      + '  <div id="chatfaction"></div>'
      + '  <div id="chatall"></div>'
      + '  <div id="chatalerts"></div>'
      + '</div>'
      + '<form id="chatinput" style="display:none"><table><tr>'
      + '  <td><time></time></td>'
      + '  <td><mark>tell faction:</mark></td>'
      + '  <td><input id="chattext" type="text" maxlength="256" accesskey="c" title="[c]" /></td>'
      + '</tr></table></form>'
      + '<a id="sidebartoggle" accesskey="i" title="Toggle sidebar [i]"><span class="toggle close"></span></a>'
      + '<div id="scrollwrapper">' // enable scrolling for small screens
      + '  <div id="sidebar" style="display: none">'
      + '    <div id="playerstat">t</div>'
      + '    <div id="gamestat">&nbsp;loading global control stats</div>'
      + '    <div id="searchwrapper">'
      + '      <img src="@@INCLUDEIMAGE:image/png:current-location.png@@" title="Current Location" id="buttongeolocation">'
      + '      <input id="search" placeholder="Search location…" type="search" accesskey="f" title="Search for a place [f]"/>'
      + '    </div>'
      + '    <div id="portaldetails"></div>'
      + '    <input id="redeem" placeholder="Redeem code…" type="text"/>'
      + '    <div id="toolbox">'
      + '      <a onmouseover="setPermaLink(this)" onclick="setPermaLink(this);return androidPermalink()" title="URL link to this map view">Permalink</a>'
      + '      <a onclick="window.aboutIITC()" style="cursor: help">About IITC</a>'
      + '      <a onclick="window.regionScoreboard()" title="View regional scoreboard">Region scores</a>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div id="updatestatus"><div id="innerstatus"></div></div>'
      // avoid error by stock JS
      + '<div id="play_button"></div>';
  }

  function loadExternalScripts() : void {
    load(JQUERY)
      .then(LEAFLET)
      .then(JQUERY_UI)
      .thenRun(boot);
  }

  export function boot() : void {
    console.log('IITCv2 booting…');

    setupMarkerImage();
    // extractFromStock();
    // setupIdle();
    // setupTaphold();
    // setupStyles();
    // setupDialogs();
    // setupDataTileParams();
    // setupMap();
    // setupOMS();
    // search.setup();
    // setupRedeem();
    // setupLargeImagePreview();
    // setupSidebarToggle();
    // updateGameScore();
    // artifact.setup();
    // ornaments.setup();
    // setupPlayerStat();
    // setupTooltips();
    // chat.setup();
    // portalDetail.setup();
    // setupQRLoadLib();
    // setupLayerChooserSelectOne();
    // setupLayerChooserStatusRecorder();

    console.log('IITCv2 booted.');
  }

  function setupMarkerImage() {
    var iconDefImage = '@@INCLUDEIMAGE:image/png:marker-icon.png@@';
    var iconDefRetImage = '@@INCLUDEIMAGE:image/png:marker-icon-2x.png@@';

    L.Icon.Default = L.Icon.extend({options: {
      iconUrl: iconDefImage,
      iconRetinaUrl: iconDefRetImage,
      iconSize: new L.Point(25, 41),
      iconAnchor: new L.Point(12, 41),
      popupAnchor: new L.Point(1, -34),
    }});
  }

}
