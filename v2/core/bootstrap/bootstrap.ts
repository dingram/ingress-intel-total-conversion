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

  const SIDEBAR_WIDTH = 300;

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
    iitc.idle.setup();
    // setupTaphold();
    setupStyles();
    // setupDataTileParams();
    iitc.map.setup();
    // setupOMS();
    // search.setup();
    // setupRedeem();
    setupLargeImagePreview();
    setupSidebarToggle();
    // updateGameScore();
    // artifact.setup();
    // ornaments.setup();
    setupPlayerStat();
    // setupTooltips();
    // chat.setup();
    // portalDetail.setup();
    // setupQRLoadLib();
    // setupLayerChooserSelectOne();
    // setupLayerChooserStatusRecorder();

    $('#sidebar').show();

    iitc.plugins.setup();
    // setMapBaseLayer();
    // setupLayerChooserApi();

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

  function setupStyles() {
    const HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
    const CHAT_SHRINKED = 60;

    $('head').append('<style>' +
                     [ '#largepreview.enl img { border:2px solid ' + iitc.COLORS[iitc.TEAM_ENL] + '; } ',
                       '#largepreview.res img { border:2px solid ' + iitc.COLORS[iitc.TEAM_RES] + '; } ',
                       '#largepreview.none img { border:2px solid ' + iitc.COLORS[iitc.TEAM_NONE] + '; } ',
                       '#chatcontrols { bottom: ' + (CHAT_SHRINKED + 22) + 'px; }',
                       '#chat { height: ' + CHAT_SHRINKED + 'px; } ',
                       '.leaflet-right { margin-right: ' + (SIDEBAR_WIDTH + 1) + 'px } ',
                       '#updatestatus { width:' + (SIDEBAR_WIDTH + 2) + 'px;  } ',
                       '#sidebar { width:' + (SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/) + 'px;  } ',
                       '#sidebartoggle { right:' + (SIDEBAR_WIDTH + 1) + 'px;  } ',
                       '#scrollwrapper  { width:' + (SIDEBAR_WIDTH + 2 * HIDDEN_SCROLLBAR_ASSUMED_WIDTH) + 'px; right:-' + (2 * HIDDEN_SCROLLBAR_ASSUMED_WIDTH - 2) + 'px } ',
                       '#sidebar > * { width:' + (SIDEBAR_WIDTH + 1) + 'px;  }'].join("\n")
                       + '</style>');
  }

  function setupLargeImagePreview() {
    $('#portaldetails').on('click', '.imgpreview', function() {
      var img: HTMLImageElement = <HTMLImageElement>$(this).find('img')[0];
      var details = $(this).find('div.portalDetails')[0];
      // Dialogs have 12px padding around the content.
      var dlgWidth = Math.max(img.naturalWidth+24,500);
      if (details) {
        iitc.ui.dialog.show({
          html: '<div style="text-align: center">' + img.outerHTML + '</div>' + details.outerHTML,
          title: $(this).parent().find('h3.title').text(),
          width: dlgWidth,
        });
      } else {
        iitc.ui.dialog.show({
          html: '<div style="text-align: center">' + img.outerHTML + '</div>',
          title: $(this).parent().find('h3.title').text(),
          width: dlgWidth,
        });
      }
    });
  }

  function setupSidebarToggle() {
    $('#sidebartoggle').on('click', function() {
      var toggle = $('#sidebartoggle');
      var sidebar = $('#scrollwrapper');
      if(sidebar.is(':visible')) {
        sidebar.hide().css('z-index', 1);
        $('.leaflet-right').css('margin-right','0');
        toggle.html('<span class="toggle open"></span>');
        toggle.css('right', '0');
      } else {
        sidebar.css('z-index', 1001).show();
        $('.leaflet-right').css('margin-right', SIDEBAR_WIDTH+1+'px');
        toggle.html('<span class="toggle close"></span>');
        toggle.css('right', SIDEBAR_WIDTH+1+'px');
      }
      $('.ui-tooltip').remove();
    });
  }

  function setupPlayerStat() {
    // stock site updated to supply the actual player level, AP requirements and XM capacity values
    var level = PLAYER.verified_level;
    PLAYER.level = level; //for historical reasons IITC expects PLAYER.level to contain the current player level

    var n = PLAYER.nickname;
    PLAYER.nickMatcher = new RegExp('\\b('+n+')\\b', 'ig');

    var ap = parseInt(PLAYER.ap);
    var thisLvlAp = parseInt(PLAYER.min_ap_for_current_level);
    var nextLvlAp = parseInt(PLAYER.min_ap_for_next_level);

    // If zero nextLvlAp, player at maximum level(?)
    var lvlUpAp = nextLvlAp ? iitc.util.digits(nextLvlAp-ap) : 0;
    var lvlApProg = nextLvlAp ? Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100) : 0;

    var xmMax = parseInt(PLAYER.xm_capacity);
    var xmRatio = Math.round(PLAYER.energy/xmMax*100);

    var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';


    var t = 'Level:\t' + level + '\n'
    + 'XM:\t' + PLAYER.energy + ' / ' + xmMax + '\n'
    + 'AP:\t' + iitc.util.digits(ap) + '\n'
    + (nextLvlAp > 0 ? 'level up in:\t' + lvlUpAp + ' AP' : 'Maximal level reached(!)')
    + '\n\Invites:\t'+PLAYER.available_invites
    + '\n\nNote: your player stats can only be updated by a full reload (F5)';

    $('#playerstat').html(''
                          + '<h2 title="'+t+'">'+level+'&nbsp;'
                          + '<div id="name">'
                          + '<span class="'+cls+'">'+PLAYER.nickname+'</span>'
                          + '<a href="/_ah/logout?continue=https://www.google.com/accounts/Logout%3Fcontinue%3Dhttps://appengine.google.com/_ah/logout%253Fcontinue%253Dhttps://www.ingress.com/intel%26service%3Dah" id="signout">sign out</a>'
                          + '</div>'
                          + '<div id="stats">'
                          + '<sup>XM: '+xmRatio+'%</sup>'
                          + '<sub>' + (nextLvlAp > 0 ? 'level: '+lvlApProg+'%' : 'max level') + '</sub>'
                          + '</div>'
                          + '</h2>'
                         );
  }
}
