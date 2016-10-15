// ==UserScript==
// @id             ingress-intel-total-conversion@jonatkins
// @name           IITC: Ingress intel map total conversion
// @version        0.25.2.20161015.53955
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-10-15-053955] Total conversion for the ingress intel map.
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


// REPLACE ORIG SITE ///////////////////////////////////////////////////
if(document.getElementsByTagName('html')[0].getAttribute('itemscope') != null)
  throw('Ingress Intel Website is down, not a userscript issue.');
window.iitcBuildDate = '2016-10-15-053955';

// disable vanilla JS
window.onload = function() {};
document.body.onload = function() {};


//originally code here parsed the <Script> tags from the page to find the one that defined the PLAYER object
//however, that's already been executed, so we can just access PLAYER - no messing around needed!

if (typeof(window.PLAYER)!="object" || typeof(window.PLAYER.nickname) != "string") {
  // page doesn’t have a script tag with player information.
  if(document.getElementById('header_email')) {
    // however, we are logged in.
    // it used to be regularly common to get temporary 'account not enabled' messages from the intel site.
    // however, this is no longer common. more common is users getting account suspended/banned - and this
    // currently shows the 'not enabled' message. so it's safer to not repeatedly reload in this case
//    setTimeout('location.reload();', 3*1000);
    throw("Page doesn't have player data, but you are logged in.");
  }
  // FIXME: handle nia takedown in progress
  throw("Couldn't retrieve player data. Are you logged in?");
}


// player information is now available in a hash like this:
// window.PLAYER = {"ap": "123", "energy": 123, "available_invites": 123, "nickname": "somenick", "team": "ENLIGHTENED||RESISTANCE"};

// remove complete page. We only wanted the user-data and the page’s
// security context so we can access the API easily. Setup as much as
// possible without requiring scripts.
document.getElementsByTagName('head')[0].innerHTML = ''
  + '<title>Ingress Intel Map</title>'
  + '<style>/* general rules ******************************************************/\n\n/* for printing directly from the browser, hide all UI components\n * NOTE: @media needs to be first?\n */\n@media print {\n  .leaflet-control-container { display: none !important; }\n  #chatcontrols, #chat, #chatinput { display: none !important; }\n  #sidebartoggle, #sidebar { display: none !important; }\n  #updatestatus { display: none !important; }\n  #portal_highlight_select { display: none !important; }\n}\n\n\nhtml, body, #map {\n  height: 100%;\n  width: 100%;\n  overflow: hidden; /* workaround for #373 */\n  background: #0e3d4e;\n}\n\n\nbody {\n  font-size: 14px;\n  font-family: "Roboto", "Helvetica Neue", Helvetica, sans-serif;\n  margin: 0;\n}\n\n#scrollwrapper {\n  overflow-x: hidden;\n  overflow-y: auto;\n  position: fixed;\n  right: -38px;\n  top: 0;\n  width: 340px;\n  bottom: 45px;\n  z-index: 1001;\n  pointer-events: none;\n}\n\n#sidebar {\n  background-color: rgba(8, 48, 78, 0.9);\n  border-left: 1px solid #20A8B1;\n  color: #888;\n  position: relative;\n  left: 0;\n  top: 0;\n  max-height: 100%;\n  overflow-y:scroll;\n  overflow-x:hidden;\n  z-index: 3000;\n  pointer-events: auto;\n}\n\n#sidebartoggle {\n  display: block;\n  padding: 20px 5px;\n  margin-top: -31px; /* -(toggle height / 2) */\n  line-height: 10px;\n  position: absolute;\n  top: 108px;\n  z-index: 3001;\n  background-color: rgba(8, 48, 78, 0.9);\n  color: #FFCE00;\n  border: 1px solid #20A8B1;\n  border-right: none;\n  border-radius: 5px 0 0 5px;\n  text-decoration: none;\n  right: -50px; /* overwritten later by the script with SIDEBAR_WIDTH */\n}\n\n.enl {\n  color: #03fe03 !important;\n}\n\n.res {\n  color: #00c5ff !important;\n}\n\n.none {\n  color: #fff;\n}\n\n.nickname {\n  cursor: pointer !important;\n}\n\na {\n  color: #ffce00;\n  cursor: pointer;\n  text-decoration: none;\n}\n\na:hover {\n  text-decoration: underline;\n}\n\n/* map display, required because GMaps uses a high z-index which is\n * normally above Leaflet’s vector pane */\n.leaflet-map-pane {\n  z-index: 1000;\n}\n\n/* leaflet layer chooser, when opened, is above other panels */\n/* doesn\'t actually work :( - left commented out for reference\n.leaflet-control-layers-expanded {\n  z-index: 9999 !important;\n}\n*/\n\n\n.leaflet-control-layers-overlays label.disabled {\n  text-decoration: line-through;\n  cursor: help;\n}\n\n\n\n/* base layer selection - first column */\n.leaflet-control-layers-base {\n  float: left;\n  overflow-y: auto;\n  max-height: 600px;\n}\n\n/* overlays layer selection - 2nd column */\n.leaflet-control-layers-overlays {\n  float: left;\n  margin-left: 8px;\n  border-left: 1px solid #DDDDDD;\n  padding-left: 8px;\n  overflow-y: auto;\n  max-height: 600px;\n}\n\n/* hide the usual separator */\n.leaflet-control-layers-separator {\n  display: none;\n}\n\n\n\n.help {\n  cursor: help;\n}\n\n.toggle {\n  display: block;\n  height: 0;\n  width: 0;\n}\n\n/* field mu count */\n.fieldmu {\n  color: #FFCE00;\n  font-size: 13px;\n  font-family: Roboto, "Helvetica Neue", Helvetica, sans-serif; /*override leaflet-container */\n  text-align: center;\n  text-shadow: 0 0 0.2em black, 0 0 0.2em black, 0 0 0.2em black;\n  pointer-events: none;\n}\n\n\n/* chat ***************************************************************/\n\n#chatcontrols {\n  color: #FFCE00;\n  background: rgba(8, 48, 78, 0.9);\n  position: absolute;\n  left: 0;\n  z-index: 3000;\n  height: 26px;\n  padding-left:1px;\n}\n\n#chatcontrols.expand {\n  top: 0;\n  bottom: auto;\n}\n\n#chatcontrols a {\n  margin-left: -1px;\n  display: inline-block;\n  width: 94px;\n  text-align: center;\n  height: 24px;\n  line-height: 24px;\n  border: 1px solid #20A8B1;\n  vertical-align: top;\n}\n\n#chatcontrols a:first-child {\n  letter-spacing:-1px;\n  text-decoration: none !important;\n}\n\n#chatcontrols a.active {\n  border-color: #FFCE00;\n  border-bottom-width:0px;\n  font-weight:bold;\n  background: rgb(8, 48, 78);\n}\n\n#chatcontrols a.active + a {\n  border-left-color: #FFCE00\n}\n\n\n#chatcontrols .toggle {\n  border-left: 10px solid transparent;\n  border-right: 10px solid transparent;\n  margin: 6px auto auto;\n}\n\n#chatcontrols .expand {\n  border-bottom: 10px solid #FFCE00;\n}\n\n#chatcontrols .shrink {\n  border-top: 10px solid #FFCE00;\n}\n\n#chatcontrols .loading {\n  background-color: rgba(255,0,0,0.3);\n  -webkit-animation: chatloading 1.2s infinite linear;\n  -moz-animation: chatloading 1.2s infinite linear;\n  animation: chatloading 1.2s infinite linear;\n}\n\n@-webkit-keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n@-moz-keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n@keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n\n\n#chat {\n  position: absolute;\n  width: 708px;\n  bottom: 23px;\n  left: 0;\n  z-index: 3000;\n  background: rgba(8, 48, 78, 0.9);\n  line-height: 15px;\n  color: #eee;\n  border: 1px solid #20A8B1;\n  border-bottom: 0;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\nem {\n  color: red;\n  font-style: normal;\n}\n\n#chat.expand {\n  height:auto;\n  top: 25px;\n}\n\n\n#chat > div {\n  overflow-x:hidden;\n  overflow-y:scroll;\n  height: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  padding: 2px;\n  position:relative;\n}\n\n#chat table, #chatinput table {\n  width: 100%;\n  table-layout: fixed;\n  border-spacing: 0;\n  border-collapse: collapse;\n}\n\n#chatinput table {\n  height: 100%;\n}\n\n#chat td, #chatinput td {\n  font-size: 13px;\n  vertical-align: top;\n  padding-bottom: 3px;\n}\n\n/* time */\n#chat td:first-child, #chatinput td:first-child {\n  width: 44px;\n  overflow: hidden;\n  padding-left: 2px;\n  color: #bbb;\n  white-space: nowrap;\n}\n\n#chat time {\n  cursor: help;\n}\n\n/* nick */\n#chat td:nth-child(2), #chatinput td:nth-child(2) {\n  width: 91px;\n  overflow: hidden;\n  padding-left: 2px;\n  white-space: nowrap;\n}\n\n#chat td .system_narrowcast {\n  color: #f66 !important;\n}\n\nmark {\n  background: transparent;\n}\n\n.invisep {\n  display: inline-block;\n  width: 1px;\n  height: 1px;\n  overflow:hidden;\n  color: transparent;\n}\n\n/* divider */\nsummary {\n  color: #bbb;\n  display: inline-block;\n  height: 16px;\n  overflow: hidden;\n  padding: 0 2px;\n  white-space: nowrap;\n  width: 100%;\n}\n\n#chatinput {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  padding: 0 2px;\n  background: rgba(8, 48, 78, 0.9);\n  width: 708px;\n  height: 23px;\n  border: 1px solid #20A8B1;\n  z-index: 3001;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#chatinput td {\n  padding-bottom: 1px;\n  vertical-align: middle;\n}\n\n\n#chatinput input {\n  background: transparent;\n  color: #EEEEEE;\n  width: 100%;\n  height: 100%;\n  padding:3px 4px 1px 4px;\n}\n\n\n\n/* sidebar ************************************************************/\n\n#sidebar > * {\n  border-bottom: 1px solid #20A8B1;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n\n\n#sidebartoggle .toggle {\n  border-bottom: 10px solid transparent;\n  border-top: 10px solid transparent;\n}\n\n#sidebartoggle .open {\n  border-right: 10px solid #FFCE00;\n}\n\n#sidebartoggle .close {\n  border-left: 10px solid #FFCE00;\n}\n\n/* player stats */\n#playerstat {\n  height: 30px;\n}\n\nh2 {\n  color: #ffce00;\n  font-size: 21px;\n  padding: 0 4px;\n  margin: 0;\n  cursor:help;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  width: 100%;\n}\n\nh2 #name {\n  font-weight: 300;\n  display: inline-block;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  vertical-align: top;\n  white-space: nowrap;\n  width: 205px;\n  position: relative;\n}\n\nh2 #stats {\n  float: right;\n  height: 100%;\n  overflow: hidden;\n}\n\n#signout {\n  font-size: 12px;\n  font-weight: normal;\n  line-height: 29px;\n  padding: 0 4px;\n  position: absolute;\n  top: 0;\n  right: 0;\n  background-color: rgba(8, 48, 78, 0.5);\n  display: none; /* starts hidden */\n}\n#name:hover #signout {\n  display: block;\n}\n\nh2 sup, h2 sub {\n  display: block;\n  font-size: 11px;\n  margin-bottom: -2px;\n}\n\n\n/* gamestats */\n#gamestat {\n  height: 22px;\n}\n\n#gamestat span {\n  display: block;\n  float: left;\n  font-weight: bold;\n  cursor:help;\n  height: 21px;\n  line-height: 22px;\n}\n\n#gamestat .res {\n  background: #005684;\n  text-align: right;\n}\n\n#gamestat .enl {\n  background: #017f01;\n}\n\n\n/* search input, and others */\ninput:not([type]), .input,\ninput[type="text"], input[type="password"],\ninput[type="number"], input[type="email"],\ninput[type="search"], input[type="url"] {\n  background-color: rgba(0, 0, 0, 0.3);\n  color: #ffce00;\n  height: 24px;\n  padding:0px 4px 0px 4px;\n  font-size: 12px;\n  border:0;\n  font-family:inherit;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#searchwrapper {\n  position: relative;\n}\n#search {\n  width: 100%;\n  padding-right: 24px;\n}\n#buttongeolocation {\n  position: absolute;\n  top: 2px;\n  right: 2px;\n  cursor: pointer;\n}\n#searchwrapper h3 {\n  font-size: 1em;\n  height: auto;\n  cursor: pointer;\n}\n.searchquery {\n  max-height: 25em;\n  overflow-y: auto;\n}\n#searchwrapper .ui-accordion-header::before {\n  font-size: 18px;\n  margin-right: 2px;\n  font-weight: normal;\n  line-height: 1em;\n  content: "⊞";\n}\n#searchwrapper .ui-accordion-header-active::before {\n  content: "⊟";\n}\n#searchwrapper .ui-accordion-content {\n  margin: 0;\n  overflow: hidden;\n}\n#searchwrapper ul {\n  padding-left: 14px;\n}\n#searchwrapper li {\n  cursor: pointer;\n}\n#searchwrapper li a {\n  margin-left: -14px;\n  padding-left: 14px;\n  background-position: 1px center;\n  background-repeat: no-repeat;\n  background-size: 12px 12px;\n}\n#searchwrapper li:focus a, #searchwrapper li:hover a {\n  text-decoration: underline;\n}\n#searchwrapper li em {\n  color: #ccc;\n  font-size: 0.9em;\n}\n\n::-webkit-input-placeholder {\n  font-style: italic;\n}\n\n:-moz-placeholder {\n  font-style: italic;\n}\n\n::-moz-placeholder {\n  font-style: italic;\n}\n\n.leaflet-control-layers input {\n  height: auto;\n  padding: 0;\n}\n\n\n/* portal title and image */\nh3 {\n  font-size: 16px;\n  padding: 0 4px;\n  margin:0;\n  height: 23px;\n  width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.imgpreview {\n  height: 190px;\n  background: no-repeat center center;\n  background-size: contain;\n  cursor: help;\n  overflow: hidden;\n  position: relative;\n}\n\n.imgpreview img.hide {\n  display: none;\n}\n\n.imgpreview .portalDetails {\n  display: none;\n}\n\n#level {\n  font-size: 40px;\n  text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000, 0 0 5px #fff;\n  display: block;\n  margin-right: 15px;\n  text-align:right;\n  float: right;\n}\n\n/* portal mods */\n.mods {\n  margin: 3px auto 1px auto;\n  width: 296px;\n  height: 67px;\n  text-align: center;\n}\n\n.mods span {\n  background-color: rgba(0, 0, 0, 0.3);\n  /* can’t use inline-block because Webkit\'s implementation is buggy and\n   * introduces additional margins in random cases. No clear necessary,\n   * as that’s solved by setting height on .mods. */\n  display: block;\n  float:left;\n  height: 63px;\n  margin: 0 2px;\n  overflow: hidden;\n  padding: 2px;\n  text-align: center;\n  width: 63px;\n  cursor:help;\n  border: 1px solid #666;\n}\n\n.mods span:not([title]) {\n  cursor: auto;\n}\n\n.res .mods span, .res .meter {\n  border: 1px solid #0076b6;\n}\n.enl .mods span, .enl .meter {\n  border: 1px solid #017f01;\n}\n\n/* random details, resonator details */\n#randdetails, #resodetails {\n  width: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  padding: 0 4px;\n  table-layout: fixed;\n  border-spacing: 0m;\n  border-collapse: collapse;\n}\n\n#randdetails td, #resodetails td {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  vertical-align: top;\n  white-space: nowrap;\n  width: 50%;\n}\n\n#randdetails th, #resodetails th {\n  font-weight: normal;\n  text-align: right;\n  width: 62px;\n  padding:0px;\n  padding-right:4px;\n  padding-left:4px;\n}\n\n#randdetails th + th, #resodetails th + th {\n  text-align: left;\n  padding-right: 4px;\n  padding-left: 4px;\n}\n\n#randdetails td:first-child, #resodetails td:first-child {\n  text-align: right;\n  padding-left: 2px;\n}\n\n#randdetails td:last-child, #resodetails td:last-child {\n  text-align: left;\n  padding-right: 2px;\n}\n\n\n#randdetails {\n  margin-top: 4px;\n  margin-bottom: 5px;\n}\n\n\n#randdetails tt {\n  font-family: inherit;\n  cursor: help;\n}\n\n#artifact_target, #artifact_fragments {\n  margin-top: 4px;\n  margin-bottom: 4px;\n\n  margin-left: 8px;\n  margin-right: 8px;\n}\n\n\n/* resonators */\n#resodetails {\n  margin-bottom: 0px;\n}\n\n.meter {\n  background: #000;\n  cursor: help;\n  display: inline-block;\n  height: 18px;\n  padding: 1px;\n  width: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  position: relative;\n  left: 0;\n  top: 0;\n}\n\n.meter.north {\n  overflow: hidden;\n}\n.meter.north:before {\n  content: "";\n  background-color: red;\n  border: 1px solid #000000;\n  border-radius: 100%;\n  display: block;\n  height: 6px;\n  width: 6px;\n  left: 50%;\n  top: -3px;\n  margin-left: -4px;\n  position: absolute;\n}\n\n.meter span {\n  display: block;\n  height: 14px;\n}\n\n.meter-level {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: -2px;\n  text-shadow: 0.0em 0.0em 0.3em #808080;\n  text-align: center;\n  word-spacing: 4px; /* to leave some space for the north indicator */\n}\n\n/* links below resos */\n\n.linkdetails {\n  margin-bottom: 0px;\n  text-align: center;\n}\n\n.linkdetails aside {\n  display: inline-block;\n  white-space: nowrap;\n  margin-left: 5px;\n  margin-right: 5px;\n}\n\n#toolbox {\n  text-align: left;    /* centre didn\'t look as nice here as it did above in .linkdetails */\n}\n\n#toolbox > a {\n  margin-left: 5px;\n  margin-right: 5px;\n  white-space: nowrap;\n  display: inline-block;\n}\n\n/* a common portal display takes this much space (prevents moving\n * content when first selecting a portal) */\n\n#portaldetails {\n  min-height: 63px;\n  position: relative; /* so the below \'#portaldetails .close\' is relative to this */\n}\n\n#portaldetails .close {\n  position: absolute;\n  top: -2px;\n  right: 2px;\n  cursor: pointer;\n  color: #FFCE00;\n  font-size: 16px;\n}\n\n/* update status */\n#updatestatus {\n  background-color: rgba(8, 48, 78, 0.9);\n  border-bottom: 0;\n  border-top: 1px solid #20A8B1;\n  border-left: 1px solid #20A8B1;\n  bottom: 0;\n  color: #ffce00;\n  font-size:13px;\n  padding: 4px;\n  position: fixed;\n  right: 0;\n  z-index: 3002;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#updatestatus .map {\n  margin-left: 8px;\n}\n\n#loadlevel {\n  background: #FFF;\n  color: #000000;\n  display: inline-block;\n  min-width: 1.8em;\n  border: 1px solid #20A8B1;\n  border-width: 0 1px;\n  margin: -4px 0;\n  padding: 4px 0.2em;\n}\n\n/* Dialogs\n */\n.ui-tooltip, .ui-dialog {\n  position: absolute;\n  z-index: 9999;\n  background-color: rgba(8, 48, 78, 0.9);\n  border: 1px solid #20A8B1;\n  color: #eee;\n  font-size: 13px;\n  line-height: 15px;\n  padding: 2px 4px;\n}\n\n.ui-tooltip {\n  max-width: 300px;\n}\n\n.ui-widget-overlay {\n  height: 100%;\n  left: 0;\n  position: fixed;\n  top: 0;\n  width: 100%;\n  z-index: 10000;\n  background:  #444;\n  opacity: 0.6;\n}\n\n.ui-modal {\n  z-index: 10001 !important;\n}\n\n.ui-tooltip {\n  z-index: 10002 !important;\n}\n\n.ui-tooltip, .ui-dialog a {\n  color: #FFCE00;\n}\n\n.ui-dialog {\n  padding: 0;\n  border-radius: 2px;\n}\n\n.ui-dialog-modal .ui-dialog-titlebar-close {\n  display: none;\n}\n\n.ui-dialog-titlebar {\n  font-size: 13px;\n  line-height: 15px;\n  text-align: center;\n  padding: 4px;\n  background-color: rgba(8, 60, 78, 0.9);\n  min-width: 250px;\n}\n\n.ui-dialog-title {\n  padding: 2px;\n  font-weight: bold;\n}\n\n.ui-dialog-title-active {\n  color: #ffce00;\n}\n\n.ui-dialog-title-inactive {\n  color: #ffffff;\n}\n\n.ui-dialog-titlebar-button {\n  position: absolute;\n  display: table-cell;\n  vertical-align: middle;\n  text-align: center;\n  width: 17px;\n  height: 17px;\n  top: 3px;\n  cursor: pointer;\n  border: 1px solid rgb(32, 168, 177);\n  background-color: rgba(0, 0, 0, 0);\n  padding: 0;\n}\n\n.ui-dialog-titlebar-button:active {\n  background-color: rgb(32, 168, 177);\n}\n\n.ui-dialog-titlebar-button-close {\n  right: 4px;\n}\n\n.ui-dialog-titlebar-button-collapse {\n  right: 25px;\n}\n\n.ui-dialog-titlebar-button-collapse-expanded {\n  /* For future changes */\n}\n\n.ui-dialog-titlebar-button-collapse-collapsed {\n  background-color: rgb(32, 168, 177);\n}\n\n.ui-dialog-titlebar-button-collapse::after,\n.ui-dialog-titlebar-button-close::after,\n.ui-dialog-titlebar-button-close::before {\n  content: "";\n  position: absolute;\n  top: 3px;\n  left: 50%;\n  width: 11px;\n  margin-left: -6px;\n  height: 0;\n  border-top: 2px solid rgb(32, 168, 177);\n}\n.ui-dialog-titlebar-button-close::after {\n  transform: translateY(3.5px) rotate(45deg);\n  -webkit-transform: translateY(3.5px) rotate(45deg);\n}\n.ui-dialog-titlebar-button-close::before {\n  transform: translateY(3.5px) rotate(-45deg);\n  -webkit-transform: translateY(3.5px) rotate(-45deg);\n}\n.ui-dialog-titlebar-button.ui-state-active::after,\n.ui-dialog-titlebar-button.ui-state-active::before,\n.ui-dialog-titlebar-button.ui-dialog-titlebar-button-collapse-collapsed::after,\n.ui-dialog-titlebar-button.ui-dialog-titlebar-button-collapse-collapsed::before,\n.ui-dialog-titlebar-button:active::after,\n.ui-dialog-titlebar-button:active::before {\n  border-top-color: rgba(8, 60, 78, 0.9);\n}\n\n.ui-dialog-content {\n  padding: 12px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  max-height: 600px !important;\n  max-width: 700px !important;\n  position: relative;\n}\n\n.ui-dialog-content-hidden {\n  display: none !important;\n}\n\n.ui-dialog-buttonpane {\n  padding: 6px;\n  border-top: 1px solid #20A8B1;\n}\n\n.ui-dialog-buttonset {\n  text-align: right;\n}\n\n.ui-dialog-buttonset button,\n.ui-dialog-content button {\n  padding: 2px;\n  min-width: 40px;\n  color: #FFCE00;\n  border: 1px solid #FFCE00;\n  background-color: rgba(8, 48, 78, 0.9);\n}\n\n.ui-dialog-buttonset button:hover {\n  text-decoration: underline;\n}\n\n.ui-dialog-aboutIITC {\n  width: auto !important;\n  min-width: 400px !important;\n  max-width: 600px !important;\n}\n\ntd {\n  padding: 0;\n  vertical-align: top;\n}\n\ntd + td {\n  padding-left: 4px;\n}\n\n#qrcode > canvas {\n  border: 8px solid white;\n}\n\n/* redeem results *****************************************************/\n.redeemReward {\n  font-family: Inconsolata, Consolas, Menlo, "Courier New", monospace;\n  list-style-type: none;\n  padding: 0;\n  font-size: 14px;\n}\n.redeemReward .itemlevel {\n  font-weight: bold;\n  text-shadow: 0 0 1px #000; /* L8 is hard to read on blue background */\n}\n/*\n.redeem-result-table {\n  font-size: 14px;\n  table-layout: fixed;\n}\n\n.redeem-result tr > td:first-child {\n  width: 50px;\n  text-align: right;\n}\n\n.redeem-result-html {\n  font-family: Inconsolata, Consolas, Menlo, "Courier New", monospace;\n}\n*/\n\n.pl_nudge_date {\n  background-color: #724510;\n  border-left: 1px solid #ffd652;\n  border-bottom: 1px solid #ffd652;\n  border-top: 1px solid #ffd652;\n  color: #ffd652;\n  display: inline-block;\n  float: left;\n  height: 18px;\n  text-align: center;\n}\n\n.pl_nudge_pointy_spacer {\n  background: no-repeat url(//commondatastorage.googleapis.com/ingress.com/img/nudge_pointy.png);\n  display: inline-block;\n  float: left;\n  height: 20px;\n  left: 47px;\n  width: 5px;\n}\n\n.pl_nudge_player {\n  cursor: pointer;\n}\n\n.pl_nudge_me {\n  color: #ffd652;\n}\n\n.RESISTANCE {\n  color: #00c2ff;\n}\n\n.ALIENS, .ENLIGHTENED {\n  color: #28f428;\n}\n\n#portal_highlight_select {\n  position: absolute;\n  top:5px;\n  left:10px;\n  z-index: 2500;\n  font-size:11px;\n  background-color:#0E3C46;\n  color:#ffce00;\n  \n}\n\n\n\n.portal_details th, .portal_details td {\n  vertical-align: top;\n  text-align: left;\n}\n\n.portal_details th {\n  white-space: nowrap;\n  padding-right: 1em;\n}\n\n.portal_details tr.padding-top th, .portal_details tr.padding-top td {\n  padding-top: 0.7em;\n}\n\n#play_button {\n  display: none;\n}\n\n\n/** artifact dialog *****************/\ntable.artifact tr > * {\n  background: rgba(8, 48, 78, 0.9);\n}\n\ntable.artifact td.info {\n  min-width: 110px; /* min-width for info column, to ensure really long portal names don\'t crowd things out */\n}\n\ntable.artifact .portal {\n  min-width: 200px; /* min-width for portal names, to ensure really long lists of artifacts don\'t crowd names out */\n}\n\n\n/* leaflet popups - restyle to match the theme of IITC */\n#map .leaflet-popup {\n  pointer-events: none;\n}\n\n#map .leaflet-popup-content-wrapper {\n  border-radius: 0px;\n  -webkit-border-radius: 0px;\n  border: 1px solid #20A8B1;\n  background: #0e3d4e;\n  pointer-events: auto;\n}\n\n#map .leaflet-popup-content {\n  color: #ffce00;\n  margin: 5px 8px;\n}\n\n#map .leaflet-popup-close-button {\n  padding: 2px 1px 0 0;\n  font-size: 12px;\n  line-height: 8px;\n  width: 10px;\n  height: 10px;\n  pointer-events: auto;\n}\n\n\n#map .leaflet-popup-tip {\n  /* change the tip from an arrow to a simple line */\n  background: #20A8B1;\n  width: 1px;\n  height: 20px;\n  padding: 0;\n  margin: 0 0 0 20px;\n  -webkit-transform: none;\n  -moz-transform: none;\n  -ms-transform: none;\n  -o-transform: none;\n  transform: none;\n}\n\n\n/* misc */\n\n.no-pointer-events {\n  pointer-events: none;\n}\n\n\n.layer_off_warning {\n  color: #FFCE00;\n  margin: 8px;\n  text-align: center;\n}\n\n/* region scores */\n.cellscore .ui-accordion-header, .cellscore .ui-accordion-content {\n	border: 1px solid #20a8b1;\n	margin-top: -1px;\n	display: block;\n}\n.cellscore .ui-accordion-header {\n	color: #ffce00;\n	outline: none\n}\n.cellscore .ui-accordion-header:before {\n	font-size: 18px;\n	margin-right: 2px;\n	content: "⊞";\n}\n.cellscore .ui-accordion-header-active:before {\n	content: "⊟";\n}\ng.checkpoint:hover circle {\n  fill-opacity: 1;\n  stroke-width: 2px;\n}\n.checkpoint_table {\n	border-collapse: collapse;\n}\n.checkpoint_table td {\n	text-align: right;\n	padding-left: 10px;\n}\n\n.text-overflow-ellipsis {\n	display: inline-block;\n	overflow: hidden;\n	white-space: nowrap;\n	text-overflow: ellipsis;\n	vertical-align: text-bottom;\n	width: 100%;\n}\n\n/* tabs */\n.ui-tabs-nav {\n	display: block;\n	border-bottom: 1px solid #20a8b1;\n	border-top: 1px solid transparent;\n	margin: 3px 0 0;\n	padding: 0;\n}\n.ui-tabs-nav::after {\n	content: \'\';\n	clear: left;\n	display: block;\n	height: 0;\n	width: 0;\n}\n.ui-tabs-nav li {\n	list-style: none;\n	display: block;\n	float:left;\n	margin: 0 0 -1px;\n	border: 1px solid #20a8b1;\n}\n.ui-tabs-nav li.ui-tabs-active {\n	border-bottom-color: #0F2C3F;\n	background: #0F2C3F;\n	border-width: 2px 2px 1px;\n	font-weight: bold;\n	margin: -1px 1px;\n}\n.ui-tabs-nav a {\n	display: inline-block;\n	padding: 0.2em 0.7em;\n}\n.ui-tabs-nav .ui-icon {\n	display: inline-block;\n	font-size: 0;\n	height: 22px;\n	overflow: hidden;\n	position: relative;\n	vertical-align: top;\n	width: 16px;\n}\n.ui-tabs-nav .ui-icon-close::before {\n	content: "×";\n	font-size: 16px;\n	height: 16px;\n	position: absolute;\n	text-align: center;\n	top: 2px;\n	vertical-align: baseline;\n	width: 16px;\n	cursor: pointer;\n}\n\n</style>'
  + '<style>/* required styles */\n\n.leaflet-pane,\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow,\n.leaflet-tile-container,\n.leaflet-map-pane svg,\n.leaflet-map-pane canvas,\n.leaflet-zoom-box,\n.leaflet-image-layer,\n.leaflet-layer {\n	position: absolute;\n	left: 0;\n	top: 0;\n	}\n.leaflet-container {\n	overflow: hidden;\n	}\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	-webkit-user-select: none;\n	   -moz-user-select: none;\n	        user-select: none;\n	  -webkit-user-drag: none;\n	}\n/* Safari renders non-retina tile on retina better with this, but Chrome is worse */\n.leaflet-safari .leaflet-tile {\n	image-rendering: -webkit-optimize-contrast;\n	}\n/* hack that prevents hw layers "stretching" when loading new tiles */\n.leaflet-safari .leaflet-tile-container {\n	width: 1600px;\n	height: 1600px;\n	-webkit-transform-origin: 0 0;\n	}\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	display: block;\n	}\n/* .leaflet-container svg: reset svg max-width decleration shipped in Joomla! (joomla.org) 3.x */\n/* .leaflet-container img: map is broken in FF if you have max-width: 100% on tiles */\n.leaflet-container .leaflet-overlay-pane svg,\n.leaflet-container .leaflet-marker-pane img,\n.leaflet-container .leaflet-tile-pane img,\n.leaflet-container img.leaflet-image-layer {\n	max-width: none !important;\n	}\n\n.leaflet-container.leaflet-touch-zoom {\n	-ms-touch-action: pan-x pan-y;\n	touch-action: pan-x pan-y;\n	}\n.leaflet-container.leaflet-touch-drag {\n	-ms-touch-action: pinch-zoom;\n	}\n.leaflet-container.leaflet-touch-drag.leaflet-touch-drag {\n	-ms-touch-action: none;\n	touch-action: none;\n}\n.leaflet-tile {\n	filter: inherit;\n	visibility: hidden;\n	}\n.leaflet-tile-loaded {\n	visibility: inherit;\n	}\n.leaflet-zoom-box {\n	width: 0;\n	height: 0;\n	-moz-box-sizing: border-box;\n	     box-sizing: border-box;\n	z-index: 800;\n	}\n/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */\n.leaflet-overlay-pane svg {\n	-moz-user-select: none;\n	}\n\n.leaflet-pane         { z-index: 400; }\n\n.leaflet-tile-pane    { z-index: 200; }\n.leaflet-overlay-pane { z-index: 400; }\n.leaflet-shadow-pane  { z-index: 500; }\n.leaflet-marker-pane  { z-index: 600; }\n.leaflet-tooltip-pane   { z-index: 650; }\n.leaflet-popup-pane   { z-index: 700; }\n\n.leaflet-map-pane canvas { z-index: 100; }\n.leaflet-map-pane svg    { z-index: 200; }\n\n.leaflet-vml-shape {\n	width: 1px;\n	height: 1px;\n	}\n.lvml {\n	behavior: url(#default#VML);\n	display: inline-block;\n	position: absolute;\n	}\n\n\n/* control positioning */\n\n.leaflet-control {\n	position: relative;\n	z-index: 800;\n	pointer-events: visiblePainted; /* IE 9-10 doesn\'t have auto */\n	pointer-events: auto;\n	}\n.leaflet-top,\n.leaflet-bottom {\n	position: absolute;\n	z-index: 1000;\n	pointer-events: none;\n	}\n.leaflet-top {\n	top: 0;\n	}\n.leaflet-right {\n	right: 0;\n	}\n.leaflet-bottom {\n	bottom: 0;\n	}\n.leaflet-left {\n	left: 0;\n	}\n.leaflet-control {\n	float: left;\n	clear: both;\n	}\n.leaflet-right .leaflet-control {\n	float: right;\n	}\n.leaflet-top .leaflet-control {\n	margin-top: 10px;\n	}\n.leaflet-bottom .leaflet-control {\n	margin-bottom: 10px;\n	}\n.leaflet-left .leaflet-control {\n	margin-left: 10px;\n	}\n.leaflet-right .leaflet-control {\n	margin-right: 10px;\n	}\n\n\n/* zoom and fade animations */\n\n.leaflet-fade-anim .leaflet-tile {\n	will-change: opacity;\n	}\n.leaflet-fade-anim .leaflet-popup {\n	opacity: 0;\n	-webkit-transition: opacity 0.2s linear;\n	   -moz-transition: opacity 0.2s linear;\n	     -o-transition: opacity 0.2s linear;\n	        transition: opacity 0.2s linear;\n	}\n.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {\n	opacity: 1;\n	}\n.leaflet-zoom-animated {\n	-webkit-transform-origin: 0 0;\n	    -ms-transform-origin: 0 0;\n	        transform-origin: 0 0;\n	}\n.leaflet-zoom-anim .leaflet-zoom-animated {\n	will-change: transform;\n	}\n.leaflet-zoom-anim .leaflet-zoom-animated {\n	-webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1);\n	   -moz-transition:    -moz-transform 0.25s cubic-bezier(0,0,0.25,1);\n	     -o-transition:      -o-transform 0.25s cubic-bezier(0,0,0.25,1);\n	        transition:         transform 0.25s cubic-bezier(0,0,0.25,1);\n	}\n.leaflet-zoom-anim .leaflet-tile,\n.leaflet-pan-anim .leaflet-tile {\n	-webkit-transition: none;\n	   -moz-transition: none;\n	     -o-transition: none;\n	        transition: none;\n	}\n\n.leaflet-zoom-anim .leaflet-zoom-hide {\n	visibility: hidden;\n	}\n\n\n/* cursors */\n\n.leaflet-interactive {\n	cursor: pointer;\n	}\n.leaflet-grab {\n	cursor: -webkit-grab;\n	cursor:    -moz-grab;\n	}\n.leaflet-crosshair,\n.leaflet-crosshair .leaflet-interactive {\n	cursor: crosshair;\n	}\n.leaflet-popup-pane,\n.leaflet-control {\n	cursor: auto;\n	}\n.leaflet-dragging .leaflet-grab,\n.leaflet-dragging .leaflet-grab .leaflet-interactive,\n.leaflet-dragging .leaflet-marker-draggable {\n	cursor: move;\n	cursor: -webkit-grabbing;\n	cursor:    -moz-grabbing;\n	}\n\n/* marker & overlays interactivity */\n.leaflet-marker-icon,\n.leaflet-marker-shadow,\n.leaflet-image-layer,\n.leaflet-pane > svg path,\n.leaflet-tile-container {\n	pointer-events: none;\n	}\n\n.leaflet-marker-icon.leaflet-interactive,\n.leaflet-image-layer.leaflet-interactive,\n.leaflet-pane > svg path.leaflet-interactive {\n	pointer-events: visiblePainted; /* IE 9-10 doesn\'t have auto */\n	pointer-events: auto;\n	}\n\n/* visual tweaks */\n\n.leaflet-container {\n	background: #ddd;\n	outline: 0;\n	}\n.leaflet-container a {\n	color: #0078A8;\n	}\n.leaflet-container a.leaflet-active {\n	outline: 2px solid orange;\n	}\n.leaflet-zoom-box {\n	border: 2px dotted #38f;\n	background: rgba(255,255,255,0.5);\n	}\n\n\n/* general typography */\n.leaflet-container {\n	font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;\n	}\n\n\n/* general toolbar styles */\n\n.leaflet-bar {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.65);\n	border-radius: 4px;\n	}\n.leaflet-bar a,\n.leaflet-bar a:hover {\n	background-color: #fff;\n	border-bottom: 1px solid #ccc;\n	width: 26px;\n	height: 26px;\n	line-height: 26px;\n	display: block;\n	text-align: center;\n	text-decoration: none;\n	color: black;\n	}\n.leaflet-bar a,\n.leaflet-control-layers-toggle {\n	background-position: 50% 50%;\n	background-repeat: no-repeat;\n	display: block;\n	}\n.leaflet-bar a:hover {\n	background-color: #f4f4f4;\n	}\n.leaflet-bar a:first-child {\n	border-top-left-radius: 4px;\n	border-top-right-radius: 4px;\n	}\n.leaflet-bar a:last-child {\n	border-bottom-left-radius: 4px;\n	border-bottom-right-radius: 4px;\n	border-bottom: none;\n	}\n.leaflet-bar a.leaflet-disabled {\n	cursor: default;\n	background-color: #f4f4f4;\n	color: #bbb;\n	}\n\n.leaflet-touch .leaflet-bar a {\n	width: 30px;\n	height: 30px;\n	line-height: 30px;\n	}\n\n\n/* zoom control */\n\n.leaflet-control-zoom-in,\n.leaflet-control-zoom-out {\n	font: bold 18px \'Lucida Console\', Monaco, monospace;\n	text-indent: 1px;\n	}\n.leaflet-control-zoom-out {\n	font-size: 20px;\n	}\n\n.leaflet-touch .leaflet-control-zoom-in {\n	font-size: 22px;\n	}\n.leaflet-touch .leaflet-control-zoom-out {\n	font-size: 24px;\n	}\n\n\n/* layers control */\n\n.leaflet-control-layers {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.4);\n	background: #fff;\n	border-radius: 5px;\n	}\n.leaflet-control-layers-toggle {\n	background-image: url(images/layers.png);\n	width: 36px;\n	height: 36px;\n	}\n.leaflet-retina .leaflet-control-layers-toggle {\n	background-image: url(images/layers-2x.png);\n	background-size: 26px 26px;\n	}\n.leaflet-touch .leaflet-control-layers-toggle {\n	width: 44px;\n	height: 44px;\n	}\n.leaflet-control-layers .leaflet-control-layers-list,\n.leaflet-control-layers-expanded .leaflet-control-layers-toggle {\n	display: none;\n	}\n.leaflet-control-layers-expanded .leaflet-control-layers-list {\n	display: block;\n	position: relative;\n	}\n.leaflet-control-layers-expanded {\n	padding: 6px 10px 6px 6px;\n	color: #333;\n	background: #fff;\n	}\n.leaflet-control-layers-scrollbar {\n	overflow-y: scroll;\n	padding-right: 5px;\n	}\n.leaflet-control-layers-selector {\n	margin-top: 2px;\n	position: relative;\n	top: 1px;\n	}\n.leaflet-control-layers label {\n	display: block;\n	}\n.leaflet-control-layers-separator {\n	height: 0;\n	border-top: 1px solid #ddd;\n	margin: 5px -10px 5px -6px;\n	}\n\n/* Default icon URLs */\n.leaflet-default-icon-path {\n	background-image: url(images/marker-icon.png);\n	}\n\n\n/* attribution and scale controls */\n\n.leaflet-container .leaflet-control-attribution {\n	background: #fff;\n	background: rgba(255, 255, 255, 0.7);\n	margin: 0;\n	}\n.leaflet-control-attribution,\n.leaflet-control-scale-line {\n	padding: 0 5px;\n	color: #333;\n	}\n.leaflet-control-attribution a {\n	text-decoration: none;\n	}\n.leaflet-control-attribution a:hover {\n	text-decoration: underline;\n	}\n.leaflet-container .leaflet-control-attribution,\n.leaflet-container .leaflet-control-scale {\n	font-size: 11px;\n	}\n.leaflet-left .leaflet-control-scale {\n	margin-left: 5px;\n	}\n.leaflet-bottom .leaflet-control-scale {\n	margin-bottom: 5px;\n	}\n.leaflet-control-scale-line {\n	border: 2px solid #777;\n	border-top: none;\n	line-height: 1.1;\n	padding: 2px 5px 1px;\n	font-size: 11px;\n	white-space: nowrap;\n	overflow: hidden;\n	-moz-box-sizing: border-box;\n	     box-sizing: border-box;\n\n	background: #fff;\n	background: rgba(255, 255, 255, 0.5);\n	}\n.leaflet-control-scale-line:not(:first-child) {\n	border-top: 2px solid #777;\n	border-bottom: none;\n	margin-top: -2px;\n	}\n.leaflet-control-scale-line:not(:first-child):not(:last-child) {\n	border-bottom: 2px solid #777;\n	}\n\n.leaflet-touch .leaflet-control-attribution,\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	box-shadow: none;\n	}\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	border: 2px solid rgba(0,0,0,0.2);\n	background-clip: padding-box;\n	}\n\n\n/* popup */\n\n.leaflet-popup {\n	position: absolute;\n	text-align: center;\n	margin-bottom: 20px;\n	}\n.leaflet-popup-content-wrapper {\n	padding: 1px;\n	text-align: left;\n	border-radius: 12px;\n	}\n.leaflet-popup-content {\n	margin: 13px 19px;\n	line-height: 1.4;\n	}\n.leaflet-popup-content p {\n	margin: 18px 0;\n	}\n.leaflet-popup-tip-container {\n	width: 40px;\n	height: 20px;\n	position: absolute;\n	left: 50%;\n	margin-left: -20px;\n	overflow: hidden;\n	pointer-events: none;\n	}\n.leaflet-popup-tip {\n	width: 17px;\n	height: 17px;\n	padding: 1px;\n\n	margin: -10px auto 0;\n\n	-webkit-transform: rotate(45deg);\n	   -moz-transform: rotate(45deg);\n	    -ms-transform: rotate(45deg);\n	     -o-transform: rotate(45deg);\n	        transform: rotate(45deg);\n	}\n.leaflet-popup-content-wrapper,\n.leaflet-popup-tip {\n	background: white;\n	color: #333;\n	box-shadow: 0 3px 14px rgba(0,0,0,0.4);\n	}\n.leaflet-container a.leaflet-popup-close-button {\n	position: absolute;\n	top: 0;\n	right: 0;\n	padding: 4px 4px 0 0;\n	border: none;\n	text-align: center;\n	width: 18px;\n	height: 14px;\n	font: 16px/14px Tahoma, Verdana, sans-serif;\n	color: #c3c3c3;\n	text-decoration: none;\n	font-weight: bold;\n	background: transparent;\n	}\n.leaflet-container a.leaflet-popup-close-button:hover {\n	color: #999;\n	}\n.leaflet-popup-scrolled {\n	overflow: auto;\n	border-bottom: 1px solid #ddd;\n	border-top: 1px solid #ddd;\n	}\n\n.leaflet-oldie .leaflet-popup-content-wrapper {\n	zoom: 1;\n	}\n.leaflet-oldie .leaflet-popup-tip {\n	width: 24px;\n	margin: 0 auto;\n\n	-ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";\n	filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);\n	}\n.leaflet-oldie .leaflet-popup-tip-container {\n	margin-top: -1px;\n	}\n\n.leaflet-oldie .leaflet-control-zoom,\n.leaflet-oldie .leaflet-control-layers,\n.leaflet-oldie .leaflet-popup-content-wrapper,\n.leaflet-oldie .leaflet-popup-tip {\n	border: 1px solid #999;\n	}\n\n\n/* div icon */\n\n.leaflet-div-icon {\n	background: #fff;\n	border: 1px solid #666;\n	}\n\n\n/* Tooltip */\n/* Base styles for the element that has a tooltip */\n.leaflet-tooltip {\n	position: absolute;\n	padding: 6px;\n	background-color: #fff;\n	border: 1px solid #fff;\n	border-radius: 3px;\n	color: #222;\n	white-space: nowrap;\n	-webkit-user-select: none;\n	-moz-user-select: none;\n	-ms-user-select: none;\n	user-select: none;\n	pointer-events: none;\n	box-shadow: 0 1px 3px rgba(0,0,0,0.4);\n	}\n.leaflet-tooltip.leaflet-clickable {\n	cursor: pointer;\n	pointer-events: auto;\n	}\n.leaflet-tooltip-top:before,\n.leaflet-tooltip-bottom:before,\n.leaflet-tooltip-left:before,\n.leaflet-tooltip-right:before {\n	position: absolute;\n	pointer-events: none;\n	border: 6px solid transparent;\n	background: transparent;\n	content: "";\n	}\n\n/* Directions */\n\n.leaflet-tooltip-bottom {\n	margin-top: 6px;\n}\n.leaflet-tooltip-top {\n	margin-top: -6px;\n}\n.leaflet-tooltip-bottom:before,\n.leaflet-tooltip-top:before {\n	left: 50%;\n	margin-left: -6px;\n	}\n.leaflet-tooltip-top:before {\n	bottom: 0;\n	margin-bottom: -12px;\n	border-top-color: #fff;\n	}\n.leaflet-tooltip-bottom:before {\n	top: 0;\n	margin-top: -12px;\n	margin-left: -6px;\n	border-bottom-color: #fff;\n	}\n.leaflet-tooltip-left {\n	margin-left: -6px;\n}\n.leaflet-tooltip-right {\n	margin-left: 6px;\n}\n.leaflet-tooltip-left:before,\n.leaflet-tooltip-right:before {\n	top: 50%;\n	margin-top: -6px;\n	}\n.leaflet-tooltip-left:before {\n	right: 0;\n	margin-right: -12px;\n	border-left-color: #fff;\n	}\n.leaflet-tooltip-right:before {\n	left: 0;\n	margin-left: -12px;\n	border-right-color: #fff;\n	}\n</style>'
//note: smartphone.css injection moved into code/smartphone.js
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
  + '      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxNjM1OTRFNUE0RTIxMUUxODNBMUZBQ0ZFQkJDNkRBQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxNjM1OTRFNkE0RTIxMUUxODNBMUZBQ0ZFQkJDNkRBQiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjE2MzU5NEUzQTRFMjExRTE4M0ExRkFDRkVCQkM2REFCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjE2MzU5NEU0QTRFMjExRTE4M0ExRkFDRkVCQkM2REFCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+kxvtEgAAAWVJREFUeNqsVctRwzAUlDTccQlxB3RA0kHSQXLxNXEFgQrsHO1L6AA6cKgAd4BLEBXAU2YfszY2oMCb2Rlbelqv3s+2qiozYjPBVjAX3Az2WsFJcBB0WZb1Nt0IWSF4FexGyAzWdvAp6rpOpgjDxgucg3lBKViRzz3WPN6Db8OkjsgaUvQgSAW54IkI77CWwkcVN0PCPZFtAG+mzZPfmVRUhlAZK0mZIR6qbGPi7ChY4zl1yKZ+NTfxltNttg6loep8LJuUjad4zh3F7s1cbs8ayxDD9xEH+0uiL2ed+WdjwhWU2YjzVmJoUfCfhC2eb/8g7Fr73KHRDWopiWVC22kdnhymhrZfcYG6goQcAmGHhleV64lsjlUD+5cSz85RtbfUSscfrp+Qn87Ic2KuyGlBEyd8dYkO4IJfInkc70C2QMf0CD1I95hzCc1GtcfBe7hm/l1he5p3JYVh+AsoaV727EOAAQAWgF3ledLuQAAAAABJRU5ErkJggg=="/ title="Current Location" id="buttongeolocation">'
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

// putting everything in a wrapper function that in turn is placed in a
// script tag on the website allows us to execute in the site’s context
// instead of in the Greasemonkey/Extension/etc. context.
function wrapper(info) {
// a cut-down version of GM_info is passed as a parameter to the script
// (not the full GM_info - it contains the ENTIRE script source!)
window.script_info = info;




// LEAFLET PREFER CANVAS ///////////////////////////////////////////////
// Set to true if Leaflet should draw things using Canvas instead of SVG
// Disabled for now because it has several bugs: flickering, constant
// CPU usage and it continuously fires the moveend event.

//L_PREFER_CANVAS = false;

// CONFIG OPTIONS ////////////////////////////////////////////////////
window.REFRESH = 30; // refresh view every 30s (base time)
window.ZOOM_LEVEL_ADJ = 5; // add 5 seconds per zoom level
window.ON_MOVE_REFRESH = 2.5;  //refresh time to use after a movement event
window.MINIMUM_OVERRIDE_REFRESH = 10; //limit on refresh time since previous refresh, limiting repeated move refresh rate
window.REFRESH_GAME_SCORE = 15*60; // refresh game score every 15 minutes
window.MAX_IDLE_TIME = 15*60; // stop updating map after 15min idling
window.HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
window.SIDEBAR_WIDTH = 300;

// how many pixels to the top before requesting new data
window.CHAT_REQUEST_SCROLL_TOP = 200;
window.CHAT_SHRINKED = 60;

// Minimum area to zoom ratio that field MU's will display
window.FIELD_MU_DISPLAY_AREA_ZOOM_RATIO = 0.001;

// Point tolerance for displaying MU's
window.FIELD_MU_DISPLAY_POINT_TOLERANCE = 60

window.COLOR_SELECTED_PORTAL = '#f0f';
window.COLORS = ['#FF6600', '#0088FF', '#03DC03']; // none, res, enl
window.COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];
window.COLORS_MOD = {VERY_RARE: '#b08cff', RARE: '#73a8ff', COMMON: '#8cffbf'};


window.MOD_TYPE = {RES_SHIELD:'Shield', MULTIHACK:'Multi-hack', FORCE_AMP:'Force Amp', HEATSINK:'Heat Sink', TURRET:'Turret', LINK_AMPLIFIER: 'Link Amp'};

// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
window.ACCESS_INDICATOR_COLOR = 'orange';
window.RANGE_INDICATOR_COLOR = 'red'

// min zoom for intel map - should match that used by stock intel
window.MIN_ZOOM = 3;

window.DEFAULT_PORTAL_IMG = '//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png';
//window.NOMINATIM = '//open.mapquestapi.com/nominatim/v1/search.php?format=json&polygon_geojson=1&q=';
window.NOMINATIM = '//nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=';

// INGRESS CONSTANTS /////////////////////////////////////////////////
// http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
window.RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
window.HACK_RANGE = 40; // in meters, max. distance from portal to be able to access it
window.OCTANTS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
window.OCTANTS_ARROW = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
window.DESTROY_RESONATOR = 75; //AP for destroying portal
window.DESTROY_LINK = 187; //AP for destroying link
window.DESTROY_FIELD = 750; //AP for destroying field
window.CAPTURE_PORTAL = 500; //AP for capturing a portal
window.DEPLOY_RESONATOR = 125; //AP for deploying a resonator
window.COMPLETION_BONUS = 250; //AP for deploying all resonators on portal
window.UPGRADE_ANOTHERS_RESONATOR = 65; //AP for upgrading another's resonator
window.MAX_PORTAL_LEVEL = 8;
window.MAX_RESO_PER_PLAYER = [0, 8, 4, 4, 4, 2, 2, 1, 1];

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
window.TEAM_NONE = 0;
window.TEAM_RES = 1;
window.TEAM_ENL = 2;
window.TEAM_TO_CSS = ['none', 'res', 'enl'];

window.SLOT_TO_LAT = [0, Math.sqrt(2)/2, 1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2];
window.SLOT_TO_LNG = [1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2];
window.EARTH_RADIUS=6378137;
window.DEG2RAD = Math.PI / 180;

// STORAGE ///////////////////////////////////////////////////////////
// global variables used for storage. Most likely READ ONLY. Proper
// way would be to encapsulate them in an anonymous function and write
// getters/setters, but if you are careful enough, this works.
window.refreshTimeout = undefined;
window.urlPortal = null;
window.urlPortalLL = null;
window.selectedPortal = null;
window.portalRangeIndicator = null;
window.portalAccessIndicator = null;
window.mapRunsUserAction = false;
//var portalsLayers, linksLayer, fieldsLayer;
var portalsFactionLayers, linksFactionLayers, fieldsFactionLayers;

// contain references to all entities loaded from the server. If render limits are hit,
// not all may be added to the leaflet layers
window.portals = {};
window.links = {};
window.fields = {};

window.resonators = {};

// contain current status(on/off) of overlay layerGroups.
// But you should use isLayerGroupDisplayed(name) to check the status
window.overlayStatus = {};

// plugin framework. Plugins may load earlier than iitc, so don’t
// overwrite data
if(typeof window.plugin !== 'function') window.plugin = function() {};


// ARTIFACT ///////////////////////////////////////////////////////

// added as part of the ingress #13magnus in november 2013, artifacts
// are additional game elements overlayed on the intel map
// currently there are only jarvis-related entities
// - shards: move between portals (along links) each hour. more than one can be at a portal
// - targets: specific portals - one per team
// the artifact data includes details for the specific portals, so can be useful
// 2014-02-06: intel site updates hint at new 'amar artifacts', likely following the same system as above


window.artifact = function() {}

window.artifact.setup = function() {
  artifact.REFRESH_JITTER = 2*60;  // 2 minute random period so not all users refresh at once
  artifact.REFRESH_SUCCESS = 60*60;  // 60 minutes on success
  artifact.REFRESH_FAILURE = 2*60;  // 2 minute retry on failure

  artifact.idle = false;
  artifact.clearData();

  addResumeFunction(artifact.idleResume);

  // move the initial data request onto a very short timer. prevents thrown exceptions causing IITC boot failures
  setTimeout (artifact.requestData, 1);

  artifact._layer = new L.LayerGroup();
  addLayerGroup ('Artifacts', artifact._layer, true);

  $('#toolbox').append(' <a onclick="window.artifact.showArtifactList()" title="Show artifact portal list">Artifacts</a>');

}

window.artifact.requestData = function() {
  if (isIdle()) {
    artifact.idle = true;
  } else {
    window.postAjax('getArtifactPortals', {}, artifact.handleSuccess, artifact.handleError);
  }
}

window.artifact.idleResume = function() {
  if (artifact.idle) {
    artifact.idle = false;
    artifact.requestData();
  }
}

window.artifact.handleSuccess = function(data) {
  artifact.processData (data);

  // start the next refresh at a multiple of REFRESH_SUCCESS seconds, plus a random REFRESH_JITTER amount to prevent excessive server hits at one time
  var now = Date.now();
  var nextTime = Math.ceil(now/(artifact.REFRESH_SUCCESS*1000))*(artifact.REFRESH_SUCCESS*1000) + Math.floor(Math.random()*artifact.REFRESH_JITTER*1000);

  setTimeout (artifact.requestData, nextTime - now);
}

window.artifact.handleFailure = function(data) {
  // no useful data on failure - do nothing

  setTimeout (artifact.requestData, artifact.REFRESH_FAILURE*1000);
}


window.artifact.processData = function(data) {

  if (data.error || !data.result) {
    console.warn('Failed to find result in getArtifactPortals response');
    return;
  }

  var oldArtifacts = artifact.entities;
  artifact.clearData();

  artifact.processResult(data.result);
  runHooks('artifactsUpdated', {old: oldArtifacts, 'new': artifact.entities});

  // redraw the artifact layer
  artifact.updateLayer();

}


window.artifact.clearData = function() {
  artifact.portalInfo = {};
  artifact.artifactTypes = {};

  artifact.entities = [];
}


window.artifact.processResult = function (portals) {
  // portals is an object, keyed from the portal GUID, containing the portal entity array

  for (var guid in portals) {
    var ent = portals[guid];
    var data = decodeArray.portalSummary(ent);

    // we no longer know the faction for the target portals, and we don't know which fragment numbers are at the portals
    // all we know, from the portal summary data, for each type of artifact, is that each artifact portal is
    // - a target portal or not - no idea for which faction
    // - has one (or more) fragments, or not

    if (!artifact.portalInfo[guid]) artifact.portalInfo[guid] = {};

    // store the decoded data - needed for lat/lng for layer markers
    artifact.portalInfo[guid]._data = data;

    for(var type in data.artifactBrief.target) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].target = TEAM_NONE;  // as we no longer know the team...
    }

    for(var type in data.artifactBrief.fragment) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].fragments = true; //as we no longer have a list of the fragments there
    }


    // let's pre-generate the entities needed to render the map - array of [guid, timestamp, ent_array]
    artifact.entities.push ( [guid, data.timestamp, ent] );

  }

}

window.artifact.getArtifactTypes = function() {
  return Object.keys(artifact.artifactTypes);
}

window.artifact.isArtifact = function(type) {
  return type in artifact.artifactTypes;
}

// used to render portals that would otherwise be below the visible level
window.artifact.getArtifactEntities = function() {
  return artifact.entities;
}

window.artifact.getInterestingPortals = function() {
  return Object.keys(artifact.portalInfo);
}

// quick test for portal being relevant to artifacts - of any type
window.artifact.isInterestingPortal = function(guid) {
  return guid in artifact.portalInfo;
}

// get the artifact data for a specified artifact id (e.g. 'jarvis'), if it exists - otherwise returns something 'false'y
window.artifact.getPortalData = function(guid,artifactId) {
  return artifact.portalInfo[guid] && artifact.portalInfo[guid][artifactId];
}

window.artifact.updateLayer = function() {
  artifact._layer.clearLayers();

  $.each(artifact.portalInfo, function(guid,data) {
    var latlng = L.latLng ([data._data.latE6/1E6, data._data.lngE6/1E6]);

    $.each(data, function(type,detail) {

      // we'll construct the URL form the type - stock seems to do that now

      var iconUrl;
      if (data[type].target !== undefined) {
        // target portal
        var iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/'+type+'_shard_target.png'
        var iconSize = 100/2;
        var opacity = 1.0;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      } else if (data[type].fragments) {
        // fragment(s) at portal

        var iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/'+type+'_shard.png'
        var iconSize = 60/2;
        var opacity = 0.6;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      }

    });  //end $.each(data, function(type,detail)

  }); //end $.each(artifact.portalInfo, function(guid,data)

}


window.artifact.showArtifactList = function() {
  var html = '';

  if (Object.keys(artifact.artifactTypes).length == 0) {
    html += '<i>No artifacts at this time</i>';
  }

  var first = true;
  $.each(artifact.artifactTypes, function(type,type2) {
    // no nice way to convert the Niantic internal name into the correct display name
    // (we do get the description string once a portal with that shard type is selected - could cache that somewhere?)
    var name = type.capitalize() + ' shards';

    if (!first) html += '<hr>';
    first = false;
    html += '<div><b>'+name+'</b></div>';

    html += '<table class="artifact artifact-'+type+'">';
    html += '<tr><th>Portal</th><th>Details</th></tr>';

    var tableRows = [];

    $.each(artifact.portalInfo, function(guid, data) {
      if (type in data) {
        // this portal has data for this artifact type - add it to the table

        var onclick = 'zoomToAndShowPortal(\''+guid+'\',['+data._data.latE6/1E6+','+data._data.lngE6/1E6+'])';
        var row = '<tr><td class="portal"><a onclick="'+onclick+'">'+escapeHtmlSpecialChars(data._data.title)+'</a></td>';

        row += '<td class="info">';

        if (data[type].target !== undefined) {
          if (data[type].target == TEAM_NONE) {
            row += '<span class="target">Target Portal</span> ';
          } else {
            row += '<span class="target '+TEAM_TO_CSS[data[type].target]+'">'+(data[type].target==TEAM_RES?'Resistance':'Enlightened')+' target</span> ';
          }
        }

        if (data[type].fragments) {
          if (data[type].target !== undefined) {
            row += '<br>';
          }
          var fragmentName = 'shard';
//          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': #'+data[type].fragments.join(', #')+'</span> ';
          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': yes</span> ';
        }

        row += '</td></tr>';

        // sort by target portals first, then by portal GUID
        var sortVal = (data[type].target !== undefined ? 'A' : 'Z') + guid;

        tableRows.push ( [sortVal, row] );
      }
    });

    // check for no rows, and add a note to the table instead
    if (tableRows.length == 0) {
      html += '<tr><td colspan="2"><i>No portals at this time</i></td></tr>';
    }

    // sort the rows
    tableRows.sort(function(a,b) {
      if (a[0] == b[0]) return 0;
      else if (a[0] < b[0]) return -1;
      else return 1;
    });

    // and add them to the table
    html += tableRows.map(function(a){return a[1];}).join('');


    html += '</table>';
  });


  html += "<hr />"
        + "<p>In Summer 2015, Niantic changed the data format for artifact portals. We no longer know:</p>"
        + "<ul><li>Which team each target portal is for - only that it is a target</li>"
        + "<li>Which shards are at each portal, just that it has one or more shards</li></ul>"
        + "<p>You can select a portal and the detailed data contains the list of shard numbers, but there's still no"
        + " more information on targets.</p>";

  dialog({
    title: 'Artifacts',
    html: html,
    width: 400,
    position: {my: 'right center', at: 'center-60 center', of: window, collision: 'fit'}
  });

}


;

/// SETUP /////////////////////////////////////////////////////////////
// these functions set up specific areas after the boot function
// created a basic framework. All of these functions should only ever
// be run once.

window.setupLargeImagePreview = function() {
  $('#portaldetails').on('click', '.imgpreview', function() {
    var img = $(this).find('img')[0];
    var details = $(this).find('div.portalDetails')[0];
    //dialogs have 12px padding around the content
    var dlgWidth = Math.max(img.naturalWidth+24,500);
    if (details) {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>' + details.outerHTML,
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    } else {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>',
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    }
  });
}

// adds listeners to the layer chooser such that a long press hides
// all custom layers except the long pressed one.
window.setupLayerChooserSelectOne = function() {
  $('.leaflet-control-layers-overlays').on('click taphold', 'label', function(e) {
    if(!e) return;
    if(!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.type === 'taphold')) return;
    var m = window.map;

    var add = function(layer) {
      if(!m.hasLayer(layer.layer)) m.addLayer(layer.layer);
    };
    var rem = function(layer) {
      if(m.hasLayer(layer.layer)) m.removeLayer(layer.layer);
    };

    var isChecked = $(e.target).find('input').is(':checked');
    var checkSize = $('.leaflet-control-layers-overlays input:checked').length;
    if((isChecked && checkSize === 1) || checkSize === 0) {
      // if nothing is selected or the users long-clicks the only
      // selected element, assume all boxes should be checked again
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(!layer.overlay) return true;
        add(layer);
      });
    } else {
      // uncheck all
      var keep = $.trim($(e.target).text());
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(layer.overlay !== true) return true;
        if(layer.name === keep) { add(layer);  return true; }
        rem(layer);
      });
    }
    e.preventDefault();
  });
}

// Setup the function to record the on/off status of overlay layerGroups
window.setupLayerChooserStatusRecorder = function() {
  // Record already added layerGroups
  $.each(window.layerChooser._layers, function(ind, chooserEntry) {
    if(!chooserEntry.overlay) return true;
    var display = window.map.hasLayer(chooserEntry.layer);
    window.updateDisplayedLayerGroup(chooserEntry.name, display);
  });

  // Record layerGroups change
  window.map.on('overlayadd overlayremove', function(e) {
    var display = (e.type === 'overlayadd');
    window.updateDisplayedLayerGroup(e.name, display);
  });
}

window.layerChooserSetDisabledStates = function() {
// layer selector - enable/disable layers that aren't visible due to zoom level
  var minlvl = getMinPortalLevel();
  var portalSelection = $('.leaflet-control-layers-overlays label');
  //it's an array - 0=unclaimed, 1=lvl 1, 2=lvl 2, ..., 8=lvl 8 - 9 relevant entries
  //mark all levels below (but not at) minlvl as disabled
  portalSelection.slice(0, minlvl).addClass('disabled').attr('title', 'Zoom in to show those.');
  //and all from minlvl to 8 as enabled
  portalSelection.slice(minlvl, 8+1).removeClass('disabled').attr('title', '');

//TODO? some generic mechanism where other layers can have their disabled state marked on/off? a few
//plugins have code to do it by hand already
}


window.setupStyles = function() {
  $('head').append('<style>' +
    [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+22)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '.leaflet-right { margin-right: '+(SIDEBAR_WIDTH+1)+'px } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH+2)+'px;  } ',
      '#sidebar { width:'+(SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/)+'px;  } ',
      '#sidebartoggle { right:'+(SIDEBAR_WIDTH+1)+'px;  } ',
      '#scrollwrapper  { width:'+(SIDEBAR_WIDTH + 2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH)+'px; right:-'+(2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH-2)+'px } ',
      '#sidebar > * { width:'+(SIDEBAR_WIDTH+1)+'px;  }'].join("\n")
    + '</style>');
}

function createDefaultBaseMapLayers() {
  var baseLayers = {};

  //OpenStreetMap attribution - required by several of the layers
  osmAttribution = 'Map data © OpenStreetMap contributors';

  // MapQuest - http://developer.mapquest.com/web/products/open/map
  // now requires an API key
  //var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  //var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  //var mqMapOpt = {attribution: osmAttribution+', Tiles Courtesy of MapQuest', maxNativeZoom: 18, maxZoom: 21, subdomains: mqSubdomains};
  //baseLayers['MapQuest OSM'] = new L.TileLayer(mqTileUrlPrefix+'/tiles/1.0.0/map/{z}/{x}/{y}.jpg',mqMapOpt);

  // MapBox - https://www.mapbox.com/api-documentation/
  // Access MapBox via the GNOME Project proxy.
  // In the future, this URL will provide improved tiles from the GNOME Project with localized labels.
  var gnomeStreetUrl = 'https://gis.gnome.org/tiles/street/v1/{z}/{x}/{y}';
  var gnomeAerialUrl = 'https://gis.gnome.org/tiles/satellite/v1/{z}/{x}/{y}';
  baseLayers['MapBox Street'] = L.tileLayer(gnomeStreetUrl);
  baseLayers['MapBox Satellite'] = L.tileLayer(gnomeAerialUrl);
  
  // cartodb has some nice tiles too - both dark and light subtle maps - http://cartodb.com/basemaps/
  // (not available over https though - not on the right domain name anyway)
  var cartoAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
  var cartoUrl = 'http://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}.png';
  baseLayers['CartoDB Dark Matter'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_all'});
  baseLayers['CartoDB Positron'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_all'});

  baseLayers['OSM'] =   L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });



  // we'll include google maps too - in the ingress default style, and a few other standard ones
  // as the stock intel map already uses the googme maps API, we just hijack their inclusion of the javascript and API key :)
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


  return baseLayers;
}



window.setupMap = function() {
  $('#map').text('');



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
  if(!isSmartphone()) {
    // chat window area
    //$(window.map._controlCorners['bottomleft']).append(
      //$('<div>').width(708).height(108).addClass('leaflet-control').css({'pointer-events': 'none', 'margin': '0'}));
  }



  var baseLayers = createDefaultBaseMapLayers();
  var lc = L.control.layers(baseLayers)

    // proper initial position is now delayed until all plugins are loaded and the base layer is set
  window.map = new L.Map('map', {
    center: [0,0],
    zoom: 1,
    zoomControl: (typeof android !== 'undefined' && android && android.showZoom) ? android.showZoom() : true,
    minZoom: MIN_ZOOM,
    markerZoomAnimation: false,
    bounceAtZoomLimits: false
  });

  lc.addTo(window.map)


  var addLayers = {};
  var hiddenLayer = [];

  portalsFactionLayers = [];
  var portalsLayers = [];
  for(var i = 0; i <= 8; i++) {
    portalsFactionLayers[i] = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    portalsLayers[i] = L.layerGroup(portalsFactionLayers[i]);
    portalsLayers[i].addTo(map);
    var t = (i === 0 ? 'Unclaimed/Placeholder' : 'Level ' + i) + ' Portals';
    addLayers[t] = portalsLayers[i];
    // Store it in hiddenLayer to remove later
    if(!isLayerGroupDisplayed(t, true)) hiddenLayer.push(portalsLayers[i]);
  }

  fieldsFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var fieldsLayer = L.layerGroup(fieldsFactionLayers);
  fieldsLayer.addTo(map);
  addLayers['Fields'] = fieldsLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Fields', true)) hiddenLayer.push(fieldsLayer);

  linksFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var linksLayer = L.layerGroup(linksFactionLayers);
  linksLayer.addTo(map);
  addLayers['Links'] = linksLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Links', true)) hiddenLayer.push(linksLayer);

  // faction-specific layers
  // these layers don't actually contain any data. instead, every time they're added/removed from the map,
  // the matching sub-layers within the above portals/fields/links are added/removed from their parent with
  // the below 'onoverlayadd/onoverlayremove' events
  var factionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  for (var fac in factionLayers) {
    factionLayers[fac].addTo(map);
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
    addLayers['Resistance'] = factionLayers[TEAM_RES];
    addLayers['Enlightened'] = factionLayers[TEAM_ENL];
  } else {
    addLayers['Enlightened'] = factionLayers[TEAM_ENL];
    addLayers['Resistance'] = factionLayers[TEAM_RES];
  }
  if (!isLayerGroupDisplayed('Resistance', true)) hiddenLayer.push (factionLayers[TEAM_RES]);
  if (!isLayerGroupDisplayed('Enlightened', true)) hiddenLayer.push (factionLayers[TEAM_ENL]);

  setFactionLayersState (TEAM_NONE, true);
  setFactionLayersState (TEAM_RES, isLayerGroupDisplayed('Resistance', true));
  setFactionLayersState (TEAM_ENL, isLayerGroupDisplayed('Enlightened', true));

  // NOTE: these events are fired by the layer chooser, so won't happen until that's created and added to the map
  window.map.on('overlayadd overlayremove', function(e) {
    var displayed = (e.type == 'overlayadd');
    switch (e.name) {
      case 'Resistance':
        setFactionLayersState (TEAM_RES, displayed);
        break;
      case 'Enlightened':
        setFactionLayersState (TEAM_ENL, displayed);
        break;
    }
  });
  


  window.layerChooser = L.control.layers(baseLayers._layers,addLayers);

  // Remove the hidden layer after layerChooser built, to avoid messing up ordering of layers 
  /*$.each(hiddenLayer, function(ind, layer){
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

  });*/

  window.layerChooser.addTo(window.map);

  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);

  map.on('moveend', function(e) {
    // two limits on map position
    // we wrap longitude (the L.LatLng 'wrap' method) - so we don't find ourselves looking beyond +-180 degrees
    // then latitude is clamped with the clampLatLng function (to the 85 deg north/south limits)
    var newPos = clampLatLng(map.getCenter().wrap());
    if (!map.getCenter().equals(newPos)) {
      map.panTo(newPos,{animate:false})
    }
  });

  // map update status handling & update map hooks
  // ensures order of calls
  map.on('movestart', function() { window.mapRunsUserAction = true; window.requests.abort(); window.startRefreshTimeout(-1); });
  map.on('moveend', function() { window.mapRunsUserAction = false; window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  map.on('zoomend', function() { window.layerChooserSetDisabledStates(); });
  window.layerChooserSetDisabledStates();

  // on zoomend, check to see the zoom level is an int, and reset the view if not
  // (there's a bug on mobile where zoom levels sometimes end up as fractional levels. this causes the base map to be invisible)
  map.on('zoomend', function() {
    var z = map.getZoom();
    if (z != parseInt(z))
    {
      console.warn('Non-integer zoom level at zoomend: '+z+' - trying to fix...');
      map.setZoom(parseInt(z), {animate:false});
    }
  });


  // set a 'moveend' handler for the map to clear idle state. e.g. after mobile 'my location' is used.
  // possibly some cases when resizing desktop browser too
  map.on('moveend', idleReset);

  window.addResumeFunction(function() { window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  // create the map data requester
  window.mapDataRequest = new MapDataRequest();
  window.mapDataRequest.start();

  // start the refresh process with a small timeout, so the first data request happens quickly
  // (the code originally called the request function directly, and triggered a normal delay for the next refresh.
  //  however, the moveend/zoomend gets triggered on map load, causing a duplicate refresh. this helps prevent that
  window.startRefreshTimeout(ON_MOVE_REFRESH*1000);
};

//adds a base layer to the map. done separately from the above, so that plugins that add base layers can be the default
window.setMapBaseLayer = function() {
  //create a map name -> layer mapping - depends on internals of L.Control.Layers
  var nameToLayer = {};
  var firstLayer = null;

  for (i in window.layerChooser._layers) {
    var obj = window.layerChooser._layers[i];
    if (!obj.overlay) {
      nameToLayer[obj.name] = obj.layer;
    }
    if (!firstLayer) firstLayer = obj.layer;
  }

  var baseLayer = nameToLayer[localStorage['iitc-base-map']] || firstLayer;
  baseLayer.addTo(map);

  // now we have a base layer we can set the map position
  // (setting an initial position, before a base layer is added, causes issues with leaflet)
  var pos = getPosition();
  map.setView (pos.center, pos.zoom, {reset:true});


  //event to track layer changes and store the name
  map.on('baselayerchange', function(info) {
    for(i in window.layerChooser._layers) {
      var obj = window.layerChooser._layers[i];
      if (info.layer === obj.layer) {
        localStorage['iitc-base-map'] = obj.name;
        break;
      }
    }

    //also, leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
    map.setZoom(map.getZoom());


  });


}

// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  // stock site updated to supply the actual player level, AP requirements and XM capacity values
  var level = PLAYER.verified_level;
  PLAYER.level = level; //for historical reasons IITC expects PLAYER.level to contain the current player level

  var n = window.PLAYER.nickname;
  PLAYER.nickMatcher = new RegExp('\\b('+n+')\\b', 'ig');

  var ap = parseInt(PLAYER.ap);
  var thisLvlAp = parseInt(PLAYER.min_ap_for_current_level);
  var nextLvlAp = parseInt(PLAYER.min_ap_for_next_level);

  if (nextLvlAp) {
    var lvlUpAp = digits(nextLvlAp-ap);
    var lvlApProg = Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100);
  } // else zero nextLvlAp - so at maximum level(?)

  var xmMax = parseInt(PLAYER.xm_capacity);
  var xmRatio = Math.round(PLAYER.energy/xmMax*100);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';


  var t = 'Level:\t' + level + '\n'
        + 'XM:\t' + PLAYER.energy + ' / ' + xmMax + '\n'
        + 'AP:\t' + digits(ap) + '\n'
        + (nextLvlAp > 0 ? 'level up in:\t' + lvlUpAp + ' AP' : 'Maximul level reached(!)')
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

window.setupSidebarToggle = function() {
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

window.setupTooltips = function(element) {
  element = element || $(document);
  element.tooltip({
    // disable show/hide animation
    show: { effect: 'none', duration: 0, delay: 350 },
    hide: false,
    open: function(event, ui) {
      // ensure all other tooltips are closed
      $(".ui-tooltip").not(ui.tooltip).remove();
    },
    content: function() {
      var title = $(this).attr('title');
      return window.convertTextToTableMagic(title);
    }
  });

  if(!window.tooltipClearerHasBeenSetup) {
    window.tooltipClearerHasBeenSetup = true;
    $(document).on('click', '.ui-tooltip', function() { $(this).remove(); });
  }
}

window.setupTaphold = function() {
  // @author Rich Adams <rich@richadams.me>

// Implements a tap and hold functionality. If you click/tap and release, it will trigger a normal
// click event. But if you click/tap and hold for 1s (default), it will trigger a taphold event instead.

;(function($)
{
    // Default options
    var defaults = {
        duration: 1000, // ms
        clickHandler: null
    }

    // When start of a taphold event is triggered.
    function startHandler(event)
    {
        var $elem = jQuery(this);

        // Merge the defaults and any user defined settings.
        settings = jQuery.extend({}, defaults, event.data);

        // If object also has click handler, store it and unbind. Taphold will trigger the
        // click itself, rather than normal propagation.
        if (typeof $elem.data("events") != "undefined"
            && typeof $elem.data("events").click != "undefined")
        {
            // Find the one without a namespace defined.
            for (var c in $elem.data("events").click)
            {
                if ($elem.data("events").click[c].namespace == "")
                {
                    var handler = $elem.data("events").click[c].handler
                    $elem.data("taphold_click_handler", handler);
                    $elem.unbind("click", handler);
                    break;
                }
            }
        }
        // Otherwise, if a custom click handler was explicitly defined, then store it instead.
        else if (typeof settings.clickHandler == "function")
        {
            $elem.data("taphold_click_handler", settings.clickHandler);
        }

        // Reset the flags
        $elem.data("taphold_triggered", false); // If a hold was triggered
        $elem.data("taphold_clicked",   false); // If a click was triggered
        $elem.data("taphold_cancelled", false); // If event has been cancelled.

        // Set the timer for the hold event.
        $elem.data("taphold_timer",
            setTimeout(function()
            {
                // If event hasn't been cancelled/clicked already, then go ahead and trigger the hold.
                if (!$elem.data("taphold_cancelled")
                    && !$elem.data("taphold_clicked"))
                {
                    // Trigger the hold event, and set the flag to say it's been triggered.
                    $elem.trigger(jQuery.extend(event, jQuery.Event("taphold")));
                    $elem.data("taphold_triggered", true);
                }
            }, settings.duration));
    }

    // When user ends a tap or click, decide what we should do.
    function stopHandler(event)
    {
        var $elem = jQuery(this);

        // If taphold has been cancelled, then we're done.
        if ($elem.data("taphold_cancelled")) { return; }

        // Clear the hold timer. If it hasn't already triggered, then it's too late anyway.
        clearTimeout($elem.data("taphold_timer"));

        // If hold wasn't triggered and not already clicked, then was a click event.
        if (!$elem.data("taphold_triggered")
            && !$elem.data("taphold_clicked"))
        {
            // If click handler, trigger it.
            if (typeof $elem.data("taphold_click_handler") == "function")
            {
                $elem.data("taphold_click_handler")(jQuery.extend(event, jQuery.Event("click")));
            }

            // Set flag to say we've triggered the click event.
            $elem.data("taphold_clicked", true);
        }
    }

    // If a user prematurely leaves the boundary of the object we're working on.
    function leaveHandler(event)
    {
        // Cancel the event.
        $(this).data("taphold_cancelled", true);
    }

    // Determine if touch events are supported.
    var touchSupported = ("ontouchstart" in window) // Most browsers
                         || ("onmsgesturechange" in window); // Mircosoft

    var taphold = $.event.special.taphold =
    {
        setup: function(data)
        {
            $(this).bind((touchSupported ? "touchstart" : "mousedown"),  data, startHandler)
                   .bind((touchSupported ? "touchend"   : "mouseup"),    stopHandler)
                   .bind((touchSupported ? "touchmove"  : "mouseleave"), leaveHandler);
            if(touchSupported)
                $(this).bind("touchcancel", leaveHandler);
        },
        teardown: function(namespaces)
        {
            $(this).unbind((touchSupported ? "touchstart" : "mousedown"),  startHandler)
                   .unbind((touchSupported ? "touchend"   : "mouseup"),    stopHandler)
                   .unbind((touchSupported ? "touchmove"  : "mouseleave"), leaveHandler);
            if(touchSupported)
                $(this).unbind("touchcancel", leaveHandler);
        }
    };
})(jQuery);

}


window.setupQRLoadLib = function() {
  (function(r){r.fn.qrcode=function(h){var s;function u(a){this.mode=s;this.data=a}function o(a,c){this.typeNumber=a;this.errorCorrectLevel=c;this.modules=null;this.moduleCount=0;this.dataCache=null;this.dataList=[]}function q(a,c){if(void 0==a.length)throw Error(a.length+"/"+c);for(var d=0;d<a.length&&0==a[d];)d++;this.num=Array(a.length-d+c);for(var b=0;b<a.length-d;b++)this.num[b]=a[b+d]}function p(a,c){this.totalCount=a;this.dataCount=c}function t(){this.buffer=[];this.length=0}u.prototype={getLength:function(){return this.data.length},
write:function(a){for(var c=0;c<this.data.length;c++)a.put(this.data.charCodeAt(c),8)}};o.prototype={addData:function(a){this.dataList.push(new u(a));this.dataCache=null},isDark:function(a,c){if(0>a||this.moduleCount<=a||0>c||this.moduleCount<=c)throw Error(a+","+c);return this.modules[a][c]},getModuleCount:function(){return this.moduleCount},make:function(){if(1>this.typeNumber){for(var a=1,a=1;40>a;a++){for(var c=p.getRSBlocks(a,this.errorCorrectLevel),d=new t,b=0,e=0;e<c.length;e++)b+=c[e].dataCount;
for(e=0;e<this.dataList.length;e++)c=this.dataList[e],d.put(c.mode,4),d.put(c.getLength(),j.getLengthInBits(c.mode,a)),c.write(d);if(d.getLengthInBits()<=8*b)break}this.typeNumber=a}this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17;this.modules=Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=Array(this.moduleCount);for(var b=0;b<this.moduleCount;b++)this.modules[d][b]=null}this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-
7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(a,c);7<=this.typeNumber&&this.setupTypeNumber(a);null==this.dataCache&&(this.dataCache=o.createData(this.typeNumber,this.errorCorrectLevel,this.dataList));this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,c){for(var d=-1;7>=d;d++)if(!(-1>=a+d||this.moduleCount<=a+d))for(var b=-1;7>=b;b++)-1>=c+b||this.moduleCount<=c+b||(this.modules[a+d][c+b]=
0<=d&&6>=d&&(0==b||6==b)||0<=b&&6>=b&&(0==d||6==d)||2<=d&&4>=d&&2<=b&&4>=b?!0:!1)},getBestMaskPattern:function(){for(var a=0,c=0,d=0;8>d;d++){this.makeImpl(!0,d);var b=j.getLostPoint(this);if(0==d||a>b)a=b,c=d}return c},createMovieClip:function(a,c,d){a=a.createEmptyMovieClip(c,d);this.make();for(c=0;c<this.modules.length;c++)for(var d=1*c,b=0;b<this.modules[c].length;b++){var e=1*b;this.modules[c][b]&&(a.beginFill(0,100),a.moveTo(e,d),a.lineTo(e+1,d),a.lineTo(e+1,d+1),a.lineTo(e,d+1),a.endFill())}return a},
setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(a=8;a<this.moduleCount-8;a++)null==this.modules[6][a]&&(this.modules[6][a]=0==a%2)},setupPositionAdjustPattern:function(){for(var a=j.getPatternPosition(this.typeNumber),c=0;c<a.length;c++)for(var d=0;d<a.length;d++){var b=a[c],e=a[d];if(null==this.modules[b][e])for(var f=-2;2>=f;f++)for(var i=-2;2>=i;i++)this.modules[b+f][e+i]=-2==f||2==f||-2==i||2==i||0==f&&0==i?!0:!1}},setupTypeNumber:function(a){for(var c=
j.getBCHTypeNumber(this.typeNumber),d=0;18>d;d++){var b=!a&&1==(c>>d&1);this.modules[Math.floor(d/3)][d%3+this.moduleCount-8-3]=b}for(d=0;18>d;d++)b=!a&&1==(c>>d&1),this.modules[d%3+this.moduleCount-8-3][Math.floor(d/3)]=b},setupTypeInfo:function(a,c){for(var d=j.getBCHTypeInfo(this.errorCorrectLevel<<3|c),b=0;15>b;b++){var e=!a&&1==(d>>b&1);6>b?this.modules[b][8]=e:8>b?this.modules[b+1][8]=e:this.modules[this.moduleCount-15+b][8]=e}for(b=0;15>b;b++)e=!a&&1==(d>>b&1),8>b?this.modules[8][this.moduleCount-
b-1]=e:9>b?this.modules[8][15-b-1+1]=e:this.modules[8][15-b-1]=e;this.modules[this.moduleCount-8][8]=!a},mapData:function(a,c){for(var d=-1,b=this.moduleCount-1,e=7,f=0,i=this.moduleCount-1;0<i;i-=2)for(6==i&&i--;;){for(var g=0;2>g;g++)if(null==this.modules[b][i-g]){var n=!1;f<a.length&&(n=1==(a[f]>>>e&1));j.getMask(c,b,i-g)&&(n=!n);this.modules[b][i-g]=n;e--; -1==e&&(f++,e=7)}b+=d;if(0>b||this.moduleCount<=b){b-=d;d=-d;break}}}};o.PAD0=236;o.PAD1=17;o.createData=function(a,c,d){for(var c=p.getRSBlocks(a,
c),b=new t,e=0;e<d.length;e++){var f=d[e];b.put(f.mode,4);b.put(f.getLength(),j.getLengthInBits(f.mode,a));f.write(b)}for(e=a=0;e<c.length;e++)a+=c[e].dataCount;if(b.getLengthInBits()>8*a)throw Error("code length overflow. ("+b.getLengthInBits()+">"+8*a+")");for(b.getLengthInBits()+4<=8*a&&b.put(0,4);0!=b.getLengthInBits()%8;)b.putBit(!1);for(;!(b.getLengthInBits()>=8*a);){b.put(o.PAD0,8);if(b.getLengthInBits()>=8*a)break;b.put(o.PAD1,8)}return o.createBytes(b,c)};o.createBytes=function(a,c){for(var d=
0,b=0,e=0,f=Array(c.length),i=Array(c.length),g=0;g<c.length;g++){var n=c[g].dataCount,h=c[g].totalCount-n,b=Math.max(b,n),e=Math.max(e,h);f[g]=Array(n);for(var k=0;k<f[g].length;k++)f[g][k]=255&a.buffer[k+d];d+=n;k=j.getErrorCorrectPolynomial(h);n=(new q(f[g],k.getLength()-1)).mod(k);i[g]=Array(k.getLength()-1);for(k=0;k<i[g].length;k++)h=k+n.getLength()-i[g].length,i[g][k]=0<=h?n.get(h):0}for(k=g=0;k<c.length;k++)g+=c[k].totalCount;d=Array(g);for(k=n=0;k<b;k++)for(g=0;g<c.length;g++)k<f[g].length&&
(d[n++]=f[g][k]);for(k=0;k<e;k++)for(g=0;g<c.length;g++)k<i[g].length&&(d[n++]=i[g][k]);return d};s=4;for(var j={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,
78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var c=a<<10;0<=j.getBCHDigit(c)-j.getBCHDigit(j.G15);)c^=j.G15<<j.getBCHDigit(c)-j.getBCHDigit(j.G15);return(a<<10|c)^j.G15_MASK},getBCHTypeNumber:function(a){for(var c=a<<12;0<=j.getBCHDigit(c)-
j.getBCHDigit(j.G18);)c^=j.G18<<j.getBCHDigit(c)-j.getBCHDigit(j.G18);return a<<12|c},getBCHDigit:function(a){for(var c=0;0!=a;)c++,a>>>=1;return c},getPatternPosition:function(a){return j.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,c,d){switch(a){case 0:return 0==(c+d)%2;case 1:return 0==c%2;case 2:return 0==d%3;case 3:return 0==(c+d)%3;case 4:return 0==(Math.floor(c/2)+Math.floor(d/3))%2;case 5:return 0==c*d%2+c*d%3;case 6:return 0==(c*d%2+c*d%3)%2;case 7:return 0==(c*d%3+(c+d)%2)%2;default:throw Error("bad maskPattern:"+
a);}},getErrorCorrectPolynomial:function(a){for(var c=new q([1],0),d=0;d<a;d++)c=c.multiply(new q([1,l.gexp(d)],0));return c},getLengthInBits:function(a,c){if(1<=c&&10>c)switch(a){case 1:return 10;case 2:return 9;case s:return 8;case 8:return 8;default:throw Error("mode:"+a);}else if(27>c)switch(a){case 1:return 12;case 2:return 11;case s:return 16;case 8:return 10;default:throw Error("mode:"+a);}else if(41>c)switch(a){case 1:return 14;case 2:return 13;case s:return 16;case 8:return 12;default:throw Error("mode:"+
a);}else throw Error("type:"+c);},getLostPoint:function(a){for(var c=a.getModuleCount(),d=0,b=0;b<c;b++)for(var e=0;e<c;e++){for(var f=0,i=a.isDark(b,e),g=-1;1>=g;g++)if(!(0>b+g||c<=b+g))for(var h=-1;1>=h;h++)0>e+h||c<=e+h||0==g&&0==h||i==a.isDark(b+g,e+h)&&f++;5<f&&(d+=3+f-5)}for(b=0;b<c-1;b++)for(e=0;e<c-1;e++)if(f=0,a.isDark(b,e)&&f++,a.isDark(b+1,e)&&f++,a.isDark(b,e+1)&&f++,a.isDark(b+1,e+1)&&f++,0==f||4==f)d+=3;for(b=0;b<c;b++)for(e=0;e<c-6;e++)a.isDark(b,e)&&!a.isDark(b,e+1)&&a.isDark(b,e+
2)&&a.isDark(b,e+3)&&a.isDark(b,e+4)&&!a.isDark(b,e+5)&&a.isDark(b,e+6)&&(d+=40);for(e=0;e<c;e++)for(b=0;b<c-6;b++)a.isDark(b,e)&&!a.isDark(b+1,e)&&a.isDark(b+2,e)&&a.isDark(b+3,e)&&a.isDark(b+4,e)&&!a.isDark(b+5,e)&&a.isDark(b+6,e)&&(d+=40);for(e=f=0;e<c;e++)for(b=0;b<c;b++)a.isDark(b,e)&&f++;a=Math.abs(100*f/c/c-50)/5;return d+10*a}},l={glog:function(a){if(1>a)throw Error("glog("+a+")");return l.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;256<=a;)a-=255;return l.EXP_TABLE[a]},EXP_TABLE:Array(256),
LOG_TABLE:Array(256)},m=0;8>m;m++)l.EXP_TABLE[m]=1<<m;for(m=8;256>m;m++)l.EXP_TABLE[m]=l.EXP_TABLE[m-4]^l.EXP_TABLE[m-5]^l.EXP_TABLE[m-6]^l.EXP_TABLE[m-8];for(m=0;255>m;m++)l.LOG_TABLE[l.EXP_TABLE[m]]=m;q.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var c=Array(this.getLength()+a.getLength()-1),d=0;d<this.getLength();d++)for(var b=0;b<a.getLength();b++)c[d+b]^=l.gexp(l.glog(this.get(d))+l.glog(a.get(b)));return new q(c,0)},mod:function(a){if(0>
this.getLength()-a.getLength())return this;for(var c=l.glog(this.get(0))-l.glog(a.get(0)),d=Array(this.getLength()),b=0;b<this.getLength();b++)d[b]=this.get(b);for(b=0;b<a.getLength();b++)d[b]^=l.gexp(l.glog(a.get(b))+c);return(new q(d,0)).mod(a)}};p.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],
[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,
116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,
43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,
3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,
55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,
45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];p.getRSBlocks=function(a,c){var d=p.getRsBlockTable(a,c);if(void 0==d)throw Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+c);for(var b=d.length/3,e=[],f=0;f<b;f++)for(var h=d[3*f+0],g=d[3*f+1],j=d[3*f+2],l=0;l<h;l++)e.push(new p(g,j));return e};p.getRsBlockTable=function(a,c){switch(c){case 1:return p.RS_BLOCK_TABLE[4*(a-1)+0];case 0:return p.RS_BLOCK_TABLE[4*(a-1)+1];case 3:return p.RS_BLOCK_TABLE[4*
(a-1)+2];case 2:return p.RS_BLOCK_TABLE[4*(a-1)+3]}};t.prototype={get:function(a){return 1==(this.buffer[Math.floor(a/8)]>>>7-a%8&1)},put:function(a,c){for(var d=0;d<c;d++)this.putBit(1==(a>>>c-d-1&1))},getLengthInBits:function(){return this.length},putBit:function(a){var c=Math.floor(this.length/8);this.buffer.length<=c&&this.buffer.push(0);a&&(this.buffer[c]|=128>>>this.length%8);this.length++}};"string"===typeof h&&(h={text:h});h=r.extend({},{render:"canvas",width:256,height:256,typeNumber:-1,
correctLevel:2,background:"#ffffff",foreground:"#000000"},h);return this.each(function(){var a;if("canvas"==h.render){a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();var c=document.createElement("canvas");c.width=h.width;c.height=h.height;for(var d=c.getContext("2d"),b=h.width/a.getModuleCount(),e=h.height/a.getModuleCount(),f=0;f<a.getModuleCount();f++)for(var i=0;i<a.getModuleCount();i++){d.fillStyle=a.isDark(f,i)?h.foreground:h.background;var g=Math.ceil((i+1)*b)-Math.floor(i*b),
j=Math.ceil((f+1)*b)-Math.floor(f*b);d.fillRect(Math.round(i*b),Math.round(f*e),g,j)}}else{a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();c=r("<table></table>").css("width",h.width+"px").css("height",h.height+"px").css("border","0px").css("border-collapse","collapse").css("background-color",h.background);d=h.width/a.getModuleCount();b=h.height/a.getModuleCount();for(e=0;e<a.getModuleCount();e++){f=r("<tr></tr>").css("height",b+"px").appendTo(c);for(i=0;i<a.getModuleCount();i++)r("<td></td>").css("width",
d+"px").css("background-color",a.isDark(e,i)?h.foreground:h.background).appendTo(f)}}a=c;jQuery(a).appendTo(this)})}})(jQuery);

}

window.setupLayerChooserApi = function() {
  // hide layer chooser if booted with the iitcm android app
  if (typeof android !== 'undefined' && android && android.setLayers) {
    $('.leaflet-control-layers').hide();
  }

  //hook some additional code into the LayerControl so it's easy for the mobile app to interface with it
  //WARNING: does depend on internals of the L.Control.Layers code
  window.layerChooser.getLayers = function() {
    var baseLayers = new Array();
    var overlayLayers = new Array();

    for (i in this._layers) {
      var obj = this._layers[i];
      var layerActive = window.map.hasLayer(obj.layer);
      var info = {
        layerId: L.stamp(obj.layer),
        name: obj.name,
        active: layerActive
      }
      if (obj.overlay) {
        overlayLayers.push(info);
      } else {
        baseLayers.push(info);
      }
    }

    var overlayLayersJSON = JSON.stringify(overlayLayers);
    var baseLayersJSON = JSON.stringify(baseLayers);

    if (typeof android !== 'undefined' && android && android.setLayers) {
        if(this.androidTimer) clearTimeout(this.androidTimer);
        this.androidTimer = setTimeout(function() {
            this.androidTimer = null;
            android.setLayers(baseLayersJSON, overlayLayersJSON);
        }, 1000);
    }

    return {
      baseLayers: baseLayers,
      overlayLayers: overlayLayers
    }
  }

  window.layerChooser.showLayer = function(id,show) {
    if (show === undefined) show = true;
    obj = this._layers[id];
    if (!obj) return false;

    if(show) {
      if (!this._map.hasLayer(obj.layer)) {
        //the layer to show is not currently active
        this._map.addLayer(obj.layer);

        //if it's a base layer, remove any others
        if (!obj.overlay) {
          for(i in this._layers) {
            if (i != id) {
              var other = this._layers[i];
              if (!other.overlay && this._map.hasLayer(other.layer)) this._map.removeLayer(other.layer);
            }
          }
        }
      }
    } else {
      if (this._map.hasLayer(obj.layer)) {
        this._map.removeLayer(obj.layer);
      }
    }

    //below logic based on code in L.Control.Layers _onInputClick
    if(!obj.overlay) {
      this._map.setZoom(this._map.getZoom());
      this._map.fire('baselayerchange', {layer: obj.layer});
    }

    return true;
  };

  var _update = window.layerChooser._update;
  window.layerChooser._update = function() {
    // update layer menu in IITCm
    try {
      if(typeof android != 'undefined')
        window.layerChooser.getLayers();
    } catch(e) {
      console.error(e);
    }
    // call through
    return _update.apply(this, arguments);
  }
  // as this setupLayerChooserApi function is called after the layer menu is populated, we need to also get they layers once
  // so they're passed through to the android app
  try {
    if(typeof android != 'undefined')
      window.layerChooser.getLayers();
  } catch(e) {
    console.error(e);
  }
}

// BOOTING ///////////////////////////////////////////////////////////

function boot() {
  if(!isSmartphone()) // TODO remove completely?
    window.debug.console.overwriteNativeIfRequired();

  console.log('loading done, booting. Built: 2016-10-15-053955');
  if(window.deviceID) console.log('Your device ID: ' + window.deviceID);
  window.runOnSmartphonesBeforeBoot();

  var iconDefImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAocSURBVHjanNRbUFN3Hgfwv9Pdzu5sZ7cP3d1eprP7sC/bPvSls9MmB5CLcg2IIAhSWwS8rFqrpbVbu3Vdd2ov04qJgGBESAJJCOR2AiFcEpKT+wkhiIiCoCJKkQhCIEgEvvsQcaoVdffhM+fMOf///3v+5/c7h8S8lk64f0wkH7/9LZGnsUSczBBREkNESRaieM9JOg6fJzUJljckPGajhMfsF6dYjolTLMV16bZMxRbnW2KehUhSGSJKtBBlvptIM+2kJt5CRIkWIkljiCSVIWS1EHEyQ6SZtrdVBe5jomRLd126dVa6ybZYn+OAbJN9qS7dOidJYy6Iki3fS3gM5/8J+bMo0VJZm2pdaHjPiaZ9XrR+dg6tn59D26FetB06h9Z/nEPzvm4ot7lRl25drI43Vzd+4PrLM4WIkpjImkRmWJHnQktxD9o+70XLJz7o9nWD3uMFvdsLeo8Xug+7oS/23b/fg4b3XBClMNfFyUx8TeIjIWtfTSPv/iGeHHj7GyLnseniJGZGs8ODtkO9aP6oG9qdXdDs8EC3x4s+5SjujMzhIn0DTfu6odnhgXZnF5o+6kbboV5odnZBlMQEaxIsuQ+FJLy+mUS/toF88vb3f5Mlu+9od3XBcPActDu7oC70QF3kgbP0Mu5cD2LOv4DFhSXM+Rcwc3MebMUQ1EUeqAs90OwMz6N3e1GTYJkVJVooSSpDalNthFTEtJKKmNbfnonruKDaxsJwsAfq7R6oClmYjl7Arb5p3J25hz7lKFo/78XsrbswHu7DOekI5qdCmLg4A/OxfqgKWai3e2D4tAfKAjeq15sHqtebf3c6ro2QmnUMqY61HJJutMPwaQ80OzzQ7/dhqGMc94KLuO68jdbPzkFVwEJ/wIfQ3CLaDvVCVcDC8GkPrjITuBdcxBXzLbQU9zwIkmU4ULHW8GX869mEnI0z//5snHlcu6sLur1euMuHMHvrLvwDAZi/7odymxvKfBbKfBa6vd0Y892B/uMeKLexYfn3d9w/jTn/ArqEw9Dt9YL+uxfCGOPE/re+e5lUxXTmSVKt0B8It+P0aBCDhh+hKmShzHdDXchCs90D7Y4welfXg3PNdg80RR405ruhKmTRr72B6dEglNvcaD7gQ22aFeI4x1ZyJsokVuQ5odvrhSLPhduDAdiOD6D9n+H3Hxibx/RoEJPDs5geDWL6ehDTo0FMXZnF9PUgAmPzmPMvwHT0Asxf9cM/GIAizwXdXi8a8pw4E2WSEGGUyakqYKHZ4YFiSzjEXX4ZjVtdGD8/DQBYureMPuUoTEf6YDx8HqYjfeiVj+De3SUAgH8wgMb33bAfH8DtwQAUW1zQbPdAVcBCGGV0E+Fa41X1/QsNueEQtnwIDVtcaP/iPEL3ix8Ym8c16wSMh/swbBzH7PhdjDj8uDe/CNO/L0CR54KjZBC3BwNoyHVBVRDuNuFa4zUiXGu8odnugTLfDflmB/yDAbjKLkOR64Qi14mhjnGMspPQfdiNUddtLC8t46Z3Cvr9PlxlJjBi80OR60R9jhO245fgHwxAvtkBZb4bmnDIDVIZ2e5uzHdDuc0NWbYD/oFwSP1mB+Q5TqiLWCwE7sHyzUU05LkwPxWCusgD4+E+hIKLoHd7Ic9xQr7ZAdsPl+AfCECW7YAyn0XjB25URrazpJwyyGTZdqiLPJBussM/GIC9ZACybDtMR/qgL/bBW3MFMzeC0O31IjA2j+b9PkwOz6K3fgRNH3aj8z8XIM92gPn6IvwDAUg3hdeTZdtRTrU2kNPR7Xuqkzqh2d4FWZYdE/0z8ImvYkA/hsW7S3CfGoIs246pa3MYNPwI/2AAg/oxzIwGUZ/jhP34AELBRQx1jMNbdQUT/TOQZdmh2dGF6qROnI5p30fKI/R/rYhqDakKWNTnOnH7cgAAMMpOoqW4B9JMO2SZdpi/6sfy0jJCwUUAgO2HS5BtskOaaYd+vw8jdj+wDExemUV9rhPqAhanogyh8gjDm6SMal5zkqNrrctkoMxn4au9hqXQEi63/whlgRvSDBvqNtohzbBhxOEHANzsnoI0w/6A8gM3LjXdxPLSMnrlI1BtY1GbweDku7qW8gj9GlIWoScCLp1TEWuAqsADaYYN+mIfxnqmEJxcgE98FfU5TtSl29C0rxvzd0IwHOxB3UYbZFl2dFVdwZx/AePnp2E42ANppg3qQg8qYw3gc+iMk5SOkBMcNSnhqF8QcOgheY4Dii1OiHkMJKkMLN/0487IHKauzcF8rB+1G6zQ7e5C3QYrOo/2YXJoFjM3grD9cAkSHgMxj4EizwX5Zgf4HLr/BFfzqxNcDSF8Skv4lJac4GiOnEnogDKfhSQtHCJJZSDLssMnuYb5qRBueCZhPNKHEYcfd6dDOF9/HYocZ3gsj4EkjYEqn4Uwvh18jvZgKdVESqkmQkojmsOopj8JKN1teY4D8mwHxCnhJxPzGIhTGKiLWAybbmH+TgjXrBPQ7OqCmGeFhGeFOIWBKIVBfY4D8s0OCLj0mICiXxZQNBFQNCHlES0P8DnaY8L4djRudYcnJjEQJTMQr0j6OVFyeJyYx6DxfTdOr2sDn0N/sbKLUqqJkJW0+14RcOlxaZYdsk121CRYIEp8upoES7idN9kg4NLXS6mmlx4K4XO1DznB0Xx5el0bFHkuiJLCCzyNKNkCRZ4LlXGtEHDo4p8GPDaEz9W+JODSo9JMG6QZdpyNM6N63erOxpkhzbSjLsMKAVc3LKDoFwWUjvwUeTS1lGoiAg79SWVsKxS5TlSvt+BsbHixn4k1ozreAkWOExUxBgi4ur1lEXryqEdrsuJFAYcelqQzqNtgQ1VMJ6pif+5MTCfq0m0Qb2DA52gvlXBUL5SEv7uHkEe3toLP1e6uiDZAnuVA9TozqqI7w2ErojtRvd4MebYDp6INKOGoi0o4KvI4pDzSsIqW3/A52osingW1qVYIo4w4E2V6QBhlRG2qFSKeGXwufZ7P1f76MfUlfK72sYX/aacVnFrbAmmGHVWxnRBGGiGMMkIYaURVbCekGXaURelRRjVvPR3ZTioj2x6LnKR0T/IrPofuqUnuhIRnRWVkB05HdaAysgMSnhU1yZ3gc7TeEo76+RMcNVkNWe09rjjBUeeWR+lRt8EGYYwRp6hWCGOMqNtgQ3mUHgKKzlr5/62GPG0An9L+UsCl2eoEE0RJFpRTBoiSLDibYMJJSuesjjf/oibBTJ6EVMd3PlFNgplURBvSSyOaIE5hUBVngjiFQVlkM757pz7t23dk5GnIqUjDs3iOz9UyZ9Z1hL+b9SZ8/26Def3rWc+tfYVHol9Ne6KnFf4BPleTWBbZDFGSBWWRehznqBJ2v3mU7HzjMNn1xr+e6Ikt/Ig1AopuK4vQQ0DRrXyudk15RAs5FWF4qtV+K6uJE1DaUPj47PP+15DnBRRdeP/4zPP+OwCV955x/18hzAAAAABJRU5ErkJggg==';
  var iconDefRetImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAABSCAYAAAAWy4frAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAABHQSURBVHja3Jt7UFtXfseVbqbbyex22kmnM9vMtjvTaaadyc7+0W5may7IjimFQkTwgsExIdixF8cxsR2yJN7N5NFMM82j2ZgbwCyYh5BAgECgixAP85Cu0FtCYIOxwbyMDcbYYGOMeenbP67O0RUvEwcn9p6Z7z9X957z+5zfef7OkQSA5E9BW56U0aafKGT8L5UxphhltOlNhYz/TCHj/6CQ8WkKGb9bGWPapow2/bTxRNcPJI9Sulg/9oQy2vQrhYz/QhltGlTIeGxSk8poU65CxocpZPyT3xuAQsb/nULGf6mQ8SMrjVRGm1Cyqx1lCRaok2yoTLajfI8VqjgzlNGmtaBuKGR8njLa9I/fGYA8wviUQsZ/oJDxs2JjyhIsqElxouHdLpx5/+yGajzRhdpUN9SJtpVg88VR/BfyCONfPVSI4ij+1eIo/kpxFI/iKB4lu9qhPeQSjH/v7Co1/T5Q673DHXFDFWcGybc4ir+ukPFvbHk/Kgo3/rk8ks+XR/KQRwq1V33QicYTgQAN6Z2oO+6B7mgHuCNuaA+7AsQdcaM21Y26Yx1oSO9cBVeT4oQy2gRSjjyS15XGmn+8VaPQ0/JI3kAyVyfZqBFNvxeaSd1xz5qG30/cER/Uu100v4Z3u1C1zy6G6ZJHGP/+2/aHf5ZH8v3yCCPkEUbUpDhXAWgPudZV28c9GO+cxvULt8F/2rvhuyuBuCNuAUQoe0weyT//YBCR/M/kkfyEPMIIhYyH7mgHLUSf5oH2sAs1Kc41Vf/bTvQ1jGF5YRkkeZe9GDJeR+OJrnW/0x52oe64h5ZTd6xDaGoRRsgj+TvyCOPPv+nQ+iN5hLGTQOjTPGg80YXGE13QHe1A9UHnmqpJccFTPIy5qQWsl+bvLKJbPQruDfe6+dSmutHwrlBe/dudUMaYiGcGCkINT28K4oVnYp4oCjdqisKF5qQ7Kri8Ib0T2sOudQs3/+EiJi/OUIPnphdwUT+GxbkleJe96G8cx51r9+jv08OzsGX3r5uf9rALDemdaHhXaMLySB5F4UYUhRtbNjWBFoUbP/J9QOeFhvROaA+tDdH8/jmMWG5QA5eXvBhsm0D9b7ugfd2NxXtC82p8pwu6NzvQVz+OpXv+JjfmmULb/5xfG+aQH4Y74iYgkEcYv9wQoiDU8GxhmGGxMMyAymS7kEl6J7gjbmgOOAJUm+pGL3cVi3NL1KiJnlswfHIemtcc0LzmgP4tDzW65aNuaA44oTngRMuH3bjqmgqA728aR91bnlXlUM+kd6Iy2Y7CMAMKwwxLhWGGf9nIG1WFYQYoZDz9WHe0Y1XmrvwBzIzNUUNuj83BmTtAAdYE+bB71e9Wtg9TQ7M0n7s35tFZMozq3zhXVRqxRxljQmGYAUXhxtr1vBFUEGpAQahBaFLpndCneaDZ76DiP+3FRM9tWvDC7BJ6qkZRm+oOeI9If1wE8kG3/zcRjPZ1F7pKhjE37R8gbl66A8vJvoC86o57aD8ldhaEGl5YC8RSEGpAya521L/difq3O1GT4kTVPjv0aR4MGScAr3/0GbFMovHEWVTtd6yruuMe+n7Lh90bvqtP68RAyzV4l/2FjNpvoPGEMEFWH3RSu0pjzQTE/cIzMU+IIf6NUNamulH/ttCkqvbZ4fjjJdy7vUgzv9E3A/7TXlTts6+QY5W4N9wYNk3isvUG6t/uXOMd+yq1/nc3xrumaXmLc0twFw6iap+d2lab6hZ7ZZsY5JOCUAOdM/RpQqerTLZjiL9Oh1Nn3gCq9gvPK5PtqNoiVa4hC9uHOxPCcD1ivYHKZDs0BxzUPoWMR0GoAfk72z6nIPk72y7k72yDOtEGfZqw6CMZDrRcAwAMtk0Iz14Var/yVXugkrdG4orqqb4CABjir9NnuqMd0Kd5UJlsR/7ONuTvbOsj3nguf0cb8ne0oTbVDX2aBzUpTqiTbFAn2XCpWQAZaJugm6QR8ySmBu/g5kCgpga/mdb6fqxzGpoDDqiTbDhfI4AMGieoPTUpTujTPKhNdYPYXRBqeE5yentrWv6ONsgjedQd96DuuEf4KFEQARlsmxCevWKDLasfDyt1lY7Qss/7PDJomKDP1Ek2amdxFE9g0iWnt7dmnN7eitJYM+qOdUB3tMP/0Tog6ldsGD87HWCA1wtccd6ELasfFrYP9pxLcKyQPecSrF/3wfp1H4bbJ+Fd8gbkMTU8i8pk+8YgiTa6p1HFmXF6eytOb289JTm9vbUqT9qCsgQL6o4JG6INQXxq+t1ZLK8wZHnRiyH+OhrSOynwSumOdqC/aRxL88urvGH8tFd4L2ljELKPKUuwIE/aglxps1aSK22250lbBJcd6xD6xyZA1Ik29DeOAwCW5peFIdPrX3Jc1I9Bl+r3rvaQCz1VowFLmmtnp7Ewu0TnjIoV+a8HUpPiRN2xDqiTbMiTtiBP2uKS5ElbruZKm1G1z06X6BV7rVSXzvg6e+uE8CzRhoq9grSvu3Dv1iLgBborR9HyUTdu9N/xr4CnFuAuGIQ9+xJmxv0r31uX74L/rBfugkF4vUJF6NM8AeVW7LWip3qUgoifaw446DyXK21GrrR5TJIrbb6dK22GZr+DrqvK91ip+pv8IOV7rKh42Sdfph2Fg4JXFpaFYTvJBnfBIO7enF+9F5lZRFfpMF2ezM8IE+35mis033KiPVb0aEZpaxDbREA0+x0E5LYkV9rcnStthjrJRj1SlmCh6m8Sms9AyzWUJViEzEQFql+xYWpYWPhd7Ziiz7WHXbioH4PX19wGDRPQH/dQgwdaJ+hCUfOagxpPVJZgQU/VKK1EsU3VB53CoJRkIyA9klxpsy5X2gxVvGVTIAKMJaBQwyfnaa2bPr9An1cl22mfqDvmoc/PvHeOrqlsWf2rAIjuB6KKtxCQeklOSFNWTkgTlDEm1Ka6UZNyfxCxyn1gV5w3aftXJwmRRe0hFwVpSO+ixk703AIATF6cQcUeK8oTrGvmvR5ITYqwHVbIeOSENCEnpOmPkpyQpndyQppQGGYAd8QN7ogbZQkWqOIFkZHpUss1qOItKBNLlHndWx46pHbIh2iBYpCyBCvMJ/t8Ew/Q/ME5fx7xq9UtAiH2qOIt1M7CMANyQppwKqTxPUl2cH3IqZBG5IQ0CaGZwy6oE21QxZmhijP7QZqvCc92C9IedmHYdB3na67QgslwOX9nEdUHnaja76Ag+rc8qEi00YXgkPE6/a5DPoRRx03UHfdAtdtC1V05SlsDsadir9D/tIdcBAKnQhojJPII45OnQhqnT4U0CuP9YRc0BxyrQc4ImVUkWuEuHMS9W/6NUG1qB1S7Laja56CjVV/9OCr22igI97oLHsWwsDS/uwTusBtluy3QiGAX7y7hbPllVO2zQxVnxjn15VUgZPurTrQRiNniKP4vJBKJRJIdXK8+FdKI4iieBhnWAmn7uBvTI/6t6ezkPFynB6B+xe9Bsg5bXliG8X/PY256Ad4lL/jPejHv29d0qUZorZfvscL6dT9uX7lL850Zn4Pp8146/IpBalKEoERxFE9AOLqMzw6ufy07uB650mYa+SvfY0VprBl9DQLIwl3/jLy0sIxe7iqq9tlRGmtGaZwgVZwZZbvNNCw0PTKL+ZlFLM0v0735zNgcKhKt1DAidZINZ8tG6EwvLnOg5RpKY810ANEeciFX2ozs4HpkBesPUZCsYP0zWcF6b1awni4BKpMFI/t9MzsAeJeEaKHet91cT2fePxewLRan9i8vQBVrhmqdb2tT3ehrCFyLDRomUBprhma/gy6hsoL1yArWL58KafxpwJ49O7i+LpPRoTBMCD5UH3SiNNbfTgFg8d4SnHkDKI1tR8mv/SqlMlMNGa+vghjvmg54Z221w5xxkc76ANCrvYLSWDMNrRaEGpDJ6JDJ6GpWBR8yGV2k70dKXrFXGN8duZcCooRTQ7PgP+tFya72NVW6qx3aQ04sipqjd8krBA5WGr7LjFLfd60fd+N67+2AtZpHMYyKvVa6qaraZycQyGR0oatAsoPr/4xluEGW4ej5h2a/A8oYE5QxJqhfteG89gqWFwOjHPq3PCiJafdLBNRVOkLf7WscXxe89oh7lQf7G8dRfdBfPok+KmQ8WIZDJqPrWTdAlxGkfYdlOJwKaaQfknM/In2aB5etk/6OP7+MC7VXodnvCASKaUfFy1bMTs5jcW5pzd/ViTacq7iM+TuLASHUxt+dhULmL1MVb6H2ZAfXg2U4sAz3xrogX23T/A3LcPdYhoMqzozqg8LeXQxCZPikBzf6ZwKGYmfeAEp/3Q7lS35ZMvrQUTSEkpfaA2Rl+3D7qj9aeWv0Ltq/vACFzBRwqKqMNqEy2U77rA/i1smgmh9tGP9lGU7OMhzyd7YJzeuA4N61jphL48xw5Q8ETI6TF2fQ8sG5NeGV0SY0vNOJ8c7AuNVZ1QgqXrYKEC/ygnxllOxqp97IlTaDZThkBGlP3jcazzLcr3zUUCfaUH3QifI91g3PzDWvOYQlu2jrO9w+Ce4NFwWoPuDApTOBkcRBwwS4wy6fF3yVtQJEbIPPLm8mo/unTZ2RsAznYhkOhWEGGnvdzCUAfZoHV91TgbVdfhkd8qEAr02cv40mXz/YCEIZY6Ll5+9sIyD6TZ9YsQz3MvFKxV4rNPsd63ql+MVAKV7kYfqiF7dG766aR+5M3IMtqx/Kl9qheNEkkuh7Ud6k7LIEC4EAy3AvbBrENxSfZRkOBaEGGpdVyHjxWfiGKoszo1MxjNnJecxNLaCnahQVL1s3/b0yxkTLzd/RRvpGyzc+DM0I0saQWijfY0Vlsh2qeIv42HiVih9EPsNX5lWx118msSOT0QU90Mkuy3AO4hUSe1XI+A1h5JE8iv9r81rre2WMiZaXJ20hIHUPfM7OMtx/ktpQxVv8XvGduz8slSVY6KJV5I1//VaXBliG41mGQ/6ONhpIVsj4hwahkPG0HDJvsAxX9a2vcGQEaUOoV3z7BlW8hZ6wbrXI1aiSXe0EYjmT0T23JfdRWIZrYBkOJLSqTrKhOIrfcoh1vFGyZbeDMoK0vyReKY31e8V3VLxlIt5QRpsIxBLLcM9u6VUnluGqWYZDrrSZBpOLo3jxWd63UnEUT/PNCWkiIPlbfuksk9H9nGU4L8twwv7EFzLaKhBVvAXqRBvdb7AMt5AdXP+zh3KDjmW4EpbhkBPStKVeId6o2GsV7zeyHtpVQJbhnvW1WyhkPL1w6TuUfGCp4oQIiTySemPuq22aZx7qvcaMIO1psosksVx5hPGBIYqjeBq8Fnnjy4d+y5RluH9gGW6eZThhcZhg+VZeUcWZUZZgEXvjzlfbNH/7nVyZZRnua5bhkB1cLwS2E4RlCzku3qxoRcRbkBWsJyCffGd3f0+FNP6EZbi7LMNBHslDFScE13wnrJtS/o42GmUsCjcSiOmTQTV//Z3exM4I0n7GMhyygvUBBvkOJ++ronAj/S6T0ZH9xvvf+ZXyk0E1T2cEaW+zDEeNKtnVjtPbW+8LQc71yTzk88ZkrrT5x5LvI7EM9xHxCjFsM14RgxNvsAyX/r1d9M9kdH/JMtwNsvkixvkO8ddUnrQFJbva6Ujngxj7apvmqe/1bxckOpnJ6IS4b6zglfVAisKNKI1d5Y03v/f/j3y1TfMUy3DjZPNF4rm50mZyUEmVK22mv5OAAstwIyeDan74SPwZhmW4N4lXlDHCf0fIQaVYReFGlOxqhzLaJPbGbx6Zf/WcDKr5IctwI2KvKKNN4sNK5IQ00T/InN7eSiAuySOMT0oepcQy3EHiFRKzLQwzUJDCMOHip2iZDpbhkiSPWpJHGJ9kGa6PbInJP3VIsyLRdVF45/z//bv6B5JHMbEMt5fUdnEUTy9QkoufxVF+b2QEaXdLHtXkC7WeI1vilXFiUUDBE3Bf9xH1yi5S6+RvTCQ6KeobMsnjkFiGc670isgbNsnjkk4G1YST2icxK1Hf+A/J45RYhjORQIUovGOQPG6JZTipqE8Qb4RIHsfEMlyjCKRB8rgmluGeF4E8L3mcE8twNSzD1Uge98Qy3C9YhvvFwy7n/wcA9Id9o31Mi8EAAAAASUVORK5CYII=';

  L.Icon.Default = L.Icon.extend({options: {
    iconUrl: iconDefImage,
    iconRetinaUrl: iconDefRetImage,
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    popupAnchor: new L.Point(1, -34),
  }});

  window.extractFromStock();
  window.setupIdle();
  window.setupTaphold();
  window.setupStyles();
  window.setupDialogs();
  window.setupDataTileParams();
  window.setupMap();
  window.setupOMS();
  window.search.setup();
  window.setupRedeem();
  window.setupLargeImagePreview();
  window.setupSidebarToggle();
  window.updateGameScore();
  window.artifact.setup();
  window.ornaments.setup();
  window.setupPlayerStat();
  window.setupTooltips();
  window.chat.setup();
  window.portalDetail.setup();
  window.setupQRLoadLib();
  window.setupLayerChooserSelectOne();
  window.setupLayerChooserStatusRecorder();
  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortalLL = getURLParam('pll');
  if(urlPortalLL) {
    urlPortalLL = urlPortalLL.split(",");
    urlPortalLL = [parseFloat(urlPortalLL[0]) || 0.0, parseFloat(urlPortalLL[1]) || 0.0];
  }
  urlPortal = getURLParam('pguid');

  $('#sidebar').show();

  if(window.bootPlugins) {
    // check to see if a known 'bad' plugin is installed. If so, alert the user, and don't boot any plugins
    var badPlugins = {
      'arc': 'Contains hidden code to report private data to a 3rd party server: <a href="https://plus.google.com/105383756361375410867/posts/4b2EjP3Du42">details here</a>',
    };

    // remove entries from badPlugins which are not installed
    $.each(badPlugins, function(name,desc) {
      if (!(window.plugin && window.plugin[name])) {
        // not detected: delete from the list
        delete badPlugins[name];
      }
    });

    // if any entries remain in the list, report this to the user and don't boot ANY plugins
    // (why not any? it's tricky to know which of the plugin boot entries were safe/unsafe)
    if (Object.keys(badPlugins).length > 0) {
      var warning = 'One or more known unsafe plugins were detected. For your safety, IITC has disabled all plugins.<ul>';
      $.each(badPlugins,function(name,desc) {
        warning += '<li><b>'+name+'</b>: '+desc+'</li>';
      });
      warning += '</ul><p>Please uninstall the problem plugins and reload the page. See this <a href="http://iitc.me/faq/#uninstall">FAQ entry</a> for help.</p><p><i>Note: It is tricky for IITC to safely disable just problem plugins</i></p>';

      dialog({
        title: 'Plugin Warning',
        html: warning,
        width: 400
      });
    } else {
      // no known unsafe plugins detected - boot all plugins
      $.each(window.bootPlugins, function(ind, ref) {
        try {
          ref();
        } catch(err) {
          console.error("error starting plugin: index "+ind+", error: "+err);
        }
      });
    }
  }
  window.setMapBaseLayer();
  window.setupLayerChooserApi();

  window.runOnSmartphonesAfterBoot();

  // workaround for #129. Not sure why this is required.
  // setTimeout('window.map.invalidateSize(false);', 500);

  window.iitcLoaded = true;
  window.runHooks('iitcLoaded');


  if (typeof android !== 'undefined' && android && android.bootFinished) {
    android.bootFinished();
  }

}


/* Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed */

//Include the chain.js microframework (http://github.com/chriso/chain.js)
(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]==="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d){b.onError.apply(a,[g,g.length]);return a}var h={};b.onError.apply(h,[g,g.length]);return c(h,null,"onError")}g.unshift(e);if(!d)return c({},[g],e);a.then=a[e],d.push(g);return f?a:a.next()}})(g)}e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)};return a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]==="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this);

var head = document.getElementsByTagName('head')[0] || document.documentElement;

addMethod('load', function (args, argc) {
    for (var queue = [], i = 0; i < argc; i++) {
        (function (i) {
            queue.push(asyncLoadScript(args[i]));
        }(i));
    }
    this.call('run', queue);
});

function asyncLoadScript(src) {
    return function (onload, onerror) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = onload;
        script.onerror = onerror;
        script.onreadystatechange = function () {
            var state = this.readyState;
            if (state === 'loaded' || state === 'complete') {
                script.onreadystatechange = null;
                onload();
            }
        };
        head.insertBefore(script, head.firstChild);
    }
}


try { console.log('Loading included JS now'); } catch(e) {}
/*
 Leaflet 1.0.1+08a140f, a JS library for interactive maps. http://leafletjs.com
 (c) 2010-2016 Vladimir Agafonkin, (c) 2010-2011 CloudMade
*/
(function (window, document, undefined) {
var L = {
	version: "1.0.1+08a140f"
};

function expose() {
	var oldL = window.L;

	L.noConflict = function () {
		window.L = oldL;
		return this;
	};

	window.L = L;
}

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = L;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(L);
}

// define Leaflet as a global L variable, saving the original L to restore later if needed
if (typeof window !== 'undefined') {
	expose();
}



/*
 * @namespace Util
 *
 * Various utility functions, used by Leaflet internally.
 */

L.Util = {

	// @function extend(dest: Object, src?: Object): Object
	// Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
	extend: function (dest) {
		var i, j, len, src;

		for (j = 1, len = arguments.length; j < len; j++) {
			src = arguments[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},

	// @function create(proto: Object, properties?: Object): Object
	// Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
	create: Object.create || (function () {
		function F() {}
		return function (proto) {
			F.prototype = proto;
			return new F();
		};
	})(),

	// @function bind(fn: Function, …): Function
	// Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	// Has a `L.bind()` shortcut.
	bind: function (fn, obj) {
		var slice = Array.prototype.slice;

		if (fn.bind) {
			return fn.bind.apply(fn, slice.call(arguments, 1));
		}

		var args = slice.call(arguments, 2);

		return function () {
			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
		};
	},

	// @function stamp(obj: Object): Number
	// Returns the unique ID of an object, assiging it one if it doesn't have it.
	stamp: function (obj) {
		/*eslint-disable */
		obj._leaflet_id = obj._leaflet_id || ++L.Util.lastId;
		return obj._leaflet_id;
		/*eslint-enable */
	},

	// @property lastId: Number
	// Last unique ID used by [`stamp()`](#util-stamp)
	lastId: 0,

	// @function throttle(fn: Function, time: Number, context: Object): Function
	// Returns a function which executes function `fn` with the given scope `context`
	// (so that the `this` keyword refers to `context` inside `fn`'s code). The function
	// `fn` will be called no more than one time per given amount of `time`. The arguments
	// received by the bound function will be any arguments passed when binding the
	// function, followed by any arguments passed when invoking the bound function.
	// Has an `L.bind` shortcut.
	throttle: function (fn, time, context) {
		var lock, args, wrapperFn, later;

		later = function () {
			// reset lock and call if queued
			lock = false;
			if (args) {
				wrapperFn.apply(context, args);
				args = false;
			}
		};

		wrapperFn = function () {
			if (lock) {
				// called too soon, queue to call later
				args = arguments;

			} else {
				// call and lock until later
				fn.apply(context, arguments);
				setTimeout(later, time);
				lock = true;
			}
		};

		return wrapperFn;
	},

	// @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
	// Returns the number `num` modulo `range` in such a way so it lies within
	// `range[0]` and `range[1]`. The returned value will be always smaller than
	// `range[1]` unless `includeMax` is set to `true`.
	wrapNum: function (x, range, includeMax) {
		var max = range[1],
		    min = range[0],
		    d = max - min;
		return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
	},

	// @function falseFn(): Function
	// Returns a function which always returns `false`.
	falseFn: function () { return false; },

	// @function formatNum(num: Number, digits?: Number): Number
	// Returns the number `num` rounded to `digits` decimals, or to 5 decimals by default.
	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	// @function trim(str: String): String
	// Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	// @function splitWords(str: String): String[]
	// Trims and splits the string on whitespace and returns the array of parts.
	splitWords: function (str) {
		return L.Util.trim(str).split(/\s+/);
	},

	// @function setOptions(obj: Object, options: Object): Object
	// Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.
	setOptions: function (obj, options) {
		if (!obj.hasOwnProperty('options')) {
			obj.options = obj.options ? L.Util.create(obj.options) : {};
		}
		for (var i in options) {
			obj.options[i] = options[i];
		}
		return obj.options;
	},

	// @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
	// Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
	// translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
	// be appended at the end. If `uppercase` is `true`, the parameter names will
	// be uppercased (e.g. `'?A=foo&B=bar'`)
	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},

	// @function template(str: String, data: Object): String
	// Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
	// and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
	// `('Hello foo, bar')`. You can also specify functions instead of strings for
	// data values — they will be evaluated passing `data` as an argument.
	template: function (str, data) {
		return str.replace(L.Util.templateRe, function (str, key) {
			var value = data[key];

			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);

			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	templateRe: /\{ *([\w_\-]+) *\}/g,

	// @function isArray(obj): Boolean
	// Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	// @function indexOf(array: Array, el: Object): Number
	// Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
	indexOf: function (array, el) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] === el) { return i; }
		}
		return -1;
	},

	// @property emptyImageUrl: String
	// Data URI string containing a base64-encoded empty GIF image.
	// Used as a hack to free memory from unused images on WebKit-powered
	// mobile devices (by setting image `src` to this string).
	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {
	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		return window['webkit' + name] || window['moz' + name] || window['ms' + name];
	}

	var lastTime = 0;

	// fallback for IE 7-8
	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer,
	    cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
	               getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };


	// @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
	// Schedules `fn` to be executed when the browser repaints. `fn` is bound to
	// `context` if given. When `immediate` is set, `fn` is called immediately if
	// the browser doesn't have native support for
	// [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
	// otherwise it's delayed. Returns a request ID that can be used to cancel the request.
	L.Util.requestAnimFrame = function (fn, context, immediate) {
		if (immediate && requestFn === timeoutDefer) {
			fn.call(context);
		} else {
			return requestFn.call(window, L.bind(fn, context));
		}
	};

	// @function cancelAnimFrame(id: Number): undefined
	// Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};
})();

// shortcuts for most used utility functions
L.extend = L.Util.extend;
L.bind = L.Util.bind;
L.stamp = L.Util.stamp;
L.setOptions = L.Util.setOptions;




// @class Class
// @aka L.Class

// @section
// @uninheritable

// Thanks to John Resig and Dean Edwards for inspiration!

L.Class = function () {};

L.Class.extend = function (props) {

	// @function extend(props: Object): Function
	// [Extends the current class](#class-inheritance) given the properties to be included.
	// Returns a Javascript function that is a class constructor (to be called with `new`).
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if(this._initHooks) {
			this.callInitHooks();
		}
	};

	var parentProto = NewClass.__super__ = this.prototype;

	var proto = L.Util.create(parentProto);
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	// inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		L.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (proto.options) {
		props.options = L.Util.extend(L.Util.create(proto.options), props.options);
	}

	// mix given properties into the prototype
	L.extend(proto, props);

	proto._initHooks = [];

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// @function include(properties: Object): this
// [Includes a mixin](#class-includes) into the current class.
L.Class.include = function (props) {
	L.extend(this.prototype, props);
	return this;
};

// @function mergeOptions(options: Object): this
// [Merges `options`](#class-options) into the defaults of the class.
L.Class.mergeOptions = function (options) {
	L.extend(this.prototype.options, options);
	return this;
};

// @function addInitHook(fn: Function): this
// Adds a [constructor hook](#class-constructor-hooks) to the class.
L.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
	return this;
};



/*
 * @class Evented
 * @aka L.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */


L.Evented = L.Class.extend({

	/* @method on(type: String, fn: Function, context?: Object): this
	 * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
	 *
	 * @alternative
	 * @method on(eventMap: Object): this
	 * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	 */
	on: function (types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (var type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}

		} else {
			// types can be a string of space-separated words
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	/* @method off(type: String, fn?: Function, context?: Object): this
	 * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
	 *
	 * @alternative
	 * @method off(eventMap: Object): this
	 * Removes a set of type/listener pairs.
	 *
	 * @alternative
	 * @method off: this
	 * Removes all listeners to all events on the object.
	 */
	off: function (types, fn, context) {

		if (!types) {
			// clear all listeners if called without arguments
			delete this._events;

		} else if (typeof types === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}

		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on: function (type, fn, context) {
		this._events = this._events || {};

		/* get/init listeners for type */
		var typeListeners = this._events[type];
		if (!typeListeners) {
			typeListeners = [];
			this._events[type] = typeListeners;
		}

		if (context === this) {
			// Less memory footprint.
			context = undefined;
		}
		var newListener = {fn: fn, ctx: context},
		    listeners = typeListeners;

		// check if fn already there
		for (var i = 0, len = listeners.length; i < len; i++) {
			if (listeners[i].fn === fn && listeners[i].ctx === context) {
				return;
			}
		}

		listeners.push(newListener);
		typeListeners.count++;
	},

	_off: function (type, fn, context) {
		var listeners,
		    i,
		    len;

		if (!this._events) { return; }

		listeners = this._events[type];

		if (!listeners) {
			return;
		}

		if (!fn) {
			// Set all removed listeners to noop so they are not called if remove happens in fire
			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].fn = L.Util.falseFn;
			}
			// clear all listeners for a type if function isn't specified
			delete this._events[type];
			return;
		}

		if (context === this) {
			context = undefined;
		}

		if (listeners) {

			// find fn and remove it
			for (i = 0, len = listeners.length; i < len; i++) {
				var l = listeners[i];
				if (l.ctx !== context) { continue; }
				if (l.fn === fn) {

					// set the removed listener to noop so that's not called if remove happens in fire
					l.fn = L.Util.falseFn;

					if (this._firingCount) {
						/* copy array in case events are being fired */
						this._events[type] = listeners = listeners.slice();
					}
					listeners.splice(i, 1);

					return;
				}
			}
		}
	},

	// @method fire(type: String, data?: Object, propagate?: Boolean): this
	// Fires an event of the specified type. You can optionally provide an data
	// object — the first argument of the listener function will contain its
	// properties. The event might can optionally be propagated to event parents.
	fire: function (type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }

		var event = L.Util.extend({}, data, {type: type, target: this});

		if (this._events) {
			var listeners = this._events[type];

			if (listeners) {
				this._firingCount = (this._firingCount + 1) || 1;
				for (var i = 0, len = listeners.length; i < len; i++) {
					var l = listeners[i];
					l.fn.call(l.ctx || this, event);
				}

				this._firingCount--;
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	// @method listens(type: String): Boolean
	// Returns `true` if a particular event type has any listeners attached to it.
	listens: function (type, propagate) {
		var listeners = this._events && this._events[type];
		if (listeners && listeners.length) { return true; }

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) { return true; }
			}
		}
		return false;
	},

	// @method once(…): this
	// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
	once: function (types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		var handler = L.bind(function () {
			this
			    .off(types, fn, context)
			    .off(types, handler, context);
		}, this);

		// add a listener that's executed once and removed after that
		return this
		    .on(types, fn, context)
		    .on(types, handler, context);
	},

	// @method addEventParent(obj: Evented): this
	// Adds an event parent - an `Evented` that will receive propagated events
	addEventParent: function (obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[L.stamp(obj)] = obj;
		return this;
	},

	// @method removeEventParent(obj: Evented): this
	// Removes an event parent, so it will stop receiving propagated events
	removeEventParent: function (obj) {
		if (this._eventParents) {
			delete this._eventParents[L.stamp(obj)];
		}
		return this;
	},

	_propagateEvent: function (e) {
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, L.extend({layer: e.target}, e), true);
		}
	}
});

var proto = L.Evented.prototype;

// aliases; we should ditch those eventually

// @method addEventListener(…): this
// Alias to [`on(…)`](#evented-on)
proto.addEventListener = proto.on;

// @method removeEventListener(…): this
// Alias to [`off(…)`](#evented-off)

// @method clearAllEventListeners(…): this
// Alias to [`off()`](#evented-off)
proto.removeEventListener = proto.clearAllEventListeners = proto.off;

// @method addOneTimeEventListener(…): this
// Alias to [`once(…)`](#evented-once)
proto.addOneTimeEventListener = proto.once;

// @method fireEvent(…): this
// Alias to [`fire(…)`](#evented-fire)
proto.fireEvent = proto.fire;

// @method hasEventListeners(…): Boolean
// Alias to [`listens(…)`](#evented-listens)
proto.hasEventListeners = proto.listens;

L.Mixin = {Events: proto};



/*
 * @namespace Browser
 * @aka L.Browser
 *
 * A namespace with static properties for browser/feature detection used by Leaflet internally.
 *
 * @example
 *
 * ```js
 * if (L.Browser.ielt9) {
 *   alert('Upgrade your browser, dude!');
 * }
 * ```
 */

(function () {

	var ua = navigator.userAgent.toLowerCase(),
	    doc = document.documentElement,

	    ie = 'ActiveXObject' in window,

	    webkit    = ua.indexOf('webkit') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android23 = ua.search('android [23]') !== -1,
	    chrome    = ua.indexOf('chrome') !== -1,
	    gecko     = ua.indexOf('gecko') !== -1  && !webkit && !window.opera && !ie,

	    win = navigator.platform.indexOf('Win') === 0,

	    mobile = typeof orientation !== 'undefined' || ua.indexOf('mobile') !== -1,
	    msPointer = !window.PointerEvent && window.MSPointerEvent,
	    pointer = window.PointerEvent || msPointer,

	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera12 = 'OTransition' in doc.style;


	var touch = !window.L_NO_TOUCH && (pointer || 'ontouchstart' in window ||
			(window.DocumentTouch && document instanceof window.DocumentTouch));

	L.Browser = {

		// @property ie: Boolean
		// `true` for all Internet Explorer versions (not Edge).
		ie: ie,

		// @property ielt9: Boolean
		// `true` for Internet Explorer versions less than 9.
		ielt9: ie && !document.addEventListener,

		// @property edge: Boolean
		// `true` for the Edge web browser.
		edge: 'msLaunchUri' in navigator && !('documentMode' in document),

		// @property webkit: Boolean
		// `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
		webkit: webkit,

		// @property gecko: Boolean
		// `true` for gecko-based browsers like Firefox.
		gecko: gecko,

		// @property android: Boolean
		// `true` for any browser running on an Android platform.
		android: ua.indexOf('android') !== -1,

		// @property android23: Boolean
		// `true` for browsers running on Android 2 or Android 3.
		android23: android23,

		// @property chrome: Boolean
		// `true` for the Chrome browser.
		chrome: chrome,

		// @property safari: Boolean
		// `true` for the Safari browser.
		safari: !chrome && ua.indexOf('safari') !== -1,


		// @property win: Boolean
		// `true` when the browser is running in a Windows platform
		win: win,


		// @property ie3d: Boolean
		// `true` for all Internet Explorer versions supporting CSS transforms.
		ie3d: ie3d,

		// @property webkit3d: Boolean
		// `true` for webkit-based browsers supporting CSS transforms.
		webkit3d: webkit3d,

		// @property gecko3d: Boolean
		// `true` for gecko-based browsers supporting CSS transforms.
		gecko3d: gecko3d,

		// @property opera12: Boolean
		// `true` for the Opera browser supporting CSS transforms (version 12 or later).
		opera12: opera12,

		// @property any3d: Boolean
		// `true` for all browsers supporting CSS transforms.
		any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs,


		// @property mobile: Boolean
		// `true` for all browsers running in a mobile device.
		mobile: mobile,

		// @property mobileWebkit: Boolean
		// `true` for all webkit-based browsers in a mobile device.
		mobileWebkit: mobile && webkit,

		// @property mobileWebkit3d: Boolean
		// `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
		mobileWebkit3d: mobile && webkit3d,

		// @property mobileOpera: Boolean
		// `true` for the Opera browser in a mobile device.
		mobileOpera: mobile && window.opera,

		// @property mobileGecko: Boolean
		// `true` for gecko-based browsers running in a mobile device.
		mobileGecko: mobile && gecko,


		// @property touch: Boolean
		// `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
		touch: !!touch,

		// @property msPointer: Boolean
		// `true` for browsers implementing the Microsoft touch events model (notably IE10).
		msPointer: !!msPointer,

		// @property pointer: Boolean
		// `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
		pointer: !!pointer,


		// @property retina: Boolean
		// `true` for browsers on a high-resolution "retina" screen.
		retina: (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1
	};

}());



/*
 * @class Point
 * @aka L.Point
 *
 * Represents a point with `x` and `y` coordinates in pixels.
 *
 * @example
 *
 * ```js
 * var point = L.point(200, 300);
 * ```
 *
 * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
 *
 * ```js
 * map.panBy([200, 300]);
 * map.panBy(L.point(200, 300));
 * ```
 */

L.Point = function (x, y, round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

L.Point.prototype = {

	// @method clone(): Point
	// Returns a copy of the current point.
	clone: function () {
		return new L.Point(this.x, this.y);
	},

	// @method add(otherPoint: Point): Point
	// Returns the result of addition of the current and the given points.
	add: function (point) {
		// non-destructive, returns a new point
		return this.clone()._add(L.point(point));
	},

	_add: function (point) {
		// destructive, used directly for performance in situations where it's safe to modify existing point
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	// @method subtract(otherPoint: Point): Point
	// Returns the result of subtraction of the given point from the current.
	subtract: function (point) {
		return this.clone()._subtract(L.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	// @method divideBy(num: Number): Point
	// Returns the result of division of the current point by the given number.
	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	// @method multiplyBy(num: Number): Point
	// Returns the result of multiplication of the current point by the given number.
	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	// @method scaleBy(scale: Point): Point
	// Multiply each coordinate of the current point by each coordinate of
	// `scale`. In linear algebra terms, multiply the point by the
	// [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
	// defined by `scale`.
	scaleBy: function (point) {
		return new L.Point(this.x * point.x, this.y * point.y);
	},

	// @method unscaleBy(scale: Point): Point
	// Inverse of `scaleBy`. Divide each coordinate of the current point by
	// each coordinate of `scale`.
	unscaleBy: function (point) {
		return new L.Point(this.x / point.x, this.y / point.y);
	},

	// @method round(): Point
	// Returns a copy of the current point with rounded coordinates.
	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	// @method floor(): Point
	// Returns a copy of the current point with floored coordinates (rounded down).
	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	// @method ceil(): Point
	// Returns a copy of the current point with ceiled coordinates (rounded up).
	ceil: function () {
		return this.clone()._ceil();
	},

	_ceil: function () {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	},

	// @method distanceTo(otherPoint: Point): Number
	// Returns the cartesian distance between the current and the given points.
	distanceTo: function (point) {
		point = L.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	// @method equals(otherPoint: Point): Boolean
	// Returns `true` if the given point has the same coordinates.
	equals: function (point) {
		point = L.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	// @method contains(otherPoint: Point): Boolean
	// Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
	contains: function (point) {
		point = L.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	// @method toString(): String
	// Returns a string representation of the point for debugging purposes.
	toString: function () {
		return 'Point(' +
		        L.Util.formatNum(this.x) + ', ' +
		        L.Util.formatNum(this.y) + ')';
	}
};

// @factory L.point(x: Number, y: Number, round?: Boolean)
// Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

// @alternative
// @factory L.point(coords: Number[])
// Expects an array of the form `[x, y]` instead.

// @alternative
// @factory L.point(coords: Object)
// Expects a plain object of the form `{x: Number, y: Number}` instead.
L.point = function (x, y, round) {
	if (x instanceof L.Point) {
		return x;
	}
	if (L.Util.isArray(x)) {
		return new L.Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	if (typeof x === 'object' && 'x' in x && 'y' in x) {
		return new L.Point(x.x, x.y);
	}
	return new L.Point(x, y, round);
};



/*
 * @class Bounds
 * @aka L.Bounds
 *
 * Represents a rectangular area in pixel coordinates.
 *
 * @example
 *
 * ```js
 * var p1 = L.point(10, 10),
 * p2 = L.point(40, 60),
 * bounds = L.bounds(p1, p2);
 * ```
 *
 * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
 *
 * ```js
 * otherBounds.intersects([[10, 10], [40, 60]]);
 * ```
 */

L.Bounds = function (a, b) {
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

L.Bounds.prototype = {
	// @method extend(point: Point): this
	// Extends the bounds to contain the given point.
	extend: function (point) { // (Point)
		point = L.point(point);

		// @property min: Point
		// The top left corner of the rectangle.
		// @property max: Point
		// The bottom right corner of the rectangle.
		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	// @method getCenter(round?: Boolean): Point
	// Returns the center point of the bounds.
	getCenter: function (round) {
		return new L.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	// @method getBottomLeft(): Point
	// Returns the bottom-left point of the bounds.
	getBottomLeft: function () {
		return new L.Point(this.min.x, this.max.y);
	},

	// @method getTopRight(): Point
	// Returns the top-right point of the bounds.
	getTopRight: function () { // -> Point
		return new L.Point(this.max.x, this.min.y);
	},

	// @method getSize(): Point
	// Returns the size of the given bounds
	getSize: function () {
		return this.max.subtract(this.min);
	},

	// @method contains(otherBounds: Bounds): Boolean
	// Returns `true` if the rectangle contains the given one.
	// @alternative
	// @method contains(point: Point): Boolean
	// Returns `true` if the rectangle contains the given point.
	contains: function (obj) {
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof L.Point) {
			obj = L.point(obj);
		} else {
			obj = L.bounds(obj);
		}

		if (obj instanceof L.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	// @method intersects(otherBounds: Bounds): Boolean
	// Returns `true` if the rectangle intersects the given bounds. Two bounds
	// intersect if they have at least one point in common.
	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	// @method overlaps(otherBounds: Bounds): Boolean
	// Returns `true` if the rectangle overlaps the given bounds. Two bounds
	// overlap if their intersection is an area.
	overlaps: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xOverlaps = (max2.x > min.x) && (min2.x < max.x),
		    yOverlaps = (max2.y > min.y) && (min2.y < max.y);

		return xOverlaps && yOverlaps;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};


// @factory L.bounds(topLeft: Point, bottomRight: Point)
// Creates a Bounds object from two coordinates (usually top-left and bottom-right corners).
// @alternative
// @factory L.bounds(points: Point[])
// Creates a Bounds object from the points it contains
L.bounds = function (a, b) {
	if (!a || a instanceof L.Bounds) {
		return a;
	}
	return new L.Bounds(a, b);
};



/*
 * @class Transformation
 * @aka L.Transformation
 *
 * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
 * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
 * the reverse. Used by Leaflet in its projections code.
 *
 * @example
 *
 * ```js
 * var transformation = new L.Transformation(2, 5, -1, 10),
 * 	p = L.point(1, 2),
 * 	p2 = transformation.transform(p), //  L.point(7, 8)
 * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
 * ```
 */


// factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
// Creates a `Transformation` object with the given coefficients.
L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	// @method transform(point: Point, scale?: Number): Point
	// Returns a transformed point, optionally multiplied by the given scale.
	// Only accepts actual `L.Point` instances, not arrays.
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	// @method untransform(point: Point, scale?: Number): Point
	// Returns the reverse transformation of the given point, optionally divided
	// by the given scale. Only accepts actual `L.Point` instances, not arrays.
	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};



/*
 * @namespace DomUtil
 *
 * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
 * tree, used by Leaflet internally.
 *
 * Most functions expecting or returning a `HTMLElement` also work for
 * SVG elements. The only difference is that classes refer to CSS classes
 * in HTML and SVG classes in SVG.
 */

L.DomUtil = {

	// @function get(id: String|HTMLElement): HTMLElement
	// Returns an element given its DOM id, or returns the element itself
	// if it was passed directly.
	get: function (id) {
		return typeof id === 'string' ? document.getElementById(id) : id;
	},

	// @function getStyle(el: HTMLElement, styleAttrib: String): String
	// Returns the value for a certain style attribute on an element,
	// including computed values or values set through CSS.
	getStyle: function (el, style) {

		var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	// @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
	// Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.
	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className || '';

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	// @function remove(el: HTMLElement)
	// Removes `el` from its parent element
	remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
			parent.removeChild(el);
		}
	},

	// @function empty(el: HTMLElement)
	// Removes all of `el`'s children elements from `el`
	empty: function (el) {
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	},

	// @function toFront(el: HTMLElement)
	// Makes `el` the last children of its parent, so it renders in front of the other children.
	toFront: function (el) {
		el.parentNode.appendChild(el);
	},

	// @function toBack(el: HTMLElement)
	// Makes `el` the first children of its parent, so it renders back from the other children.
	toBack: function (el) {
		var parent = el.parentNode;
		parent.insertBefore(el, parent.firstChild);
	},

	// @function hasClass(el: HTMLElement, name: String): Boolean
	// Returns `true` if the element's class attribute contains `name`.
	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = L.DomUtil.getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	// @function addClass(el: HTMLElement, name: String)
	// Adds `name` to the element's class attribute.
	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = L.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!L.DomUtil.hasClass(el, name)) {
			var className = L.DomUtil.getClass(el);
			L.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	// @function removeClass(el: HTMLElement, name: String)
	// Removes `name` from the element's class attribute.
	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			L.DomUtil.setClass(el, L.Util.trim((' ' + L.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	// @function setClass(el: HTMLElement, name: String)
	// Sets the element's class.
	setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	// @function getClass(el: HTMLElement): String
	// Returns the element's class.
	getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	// @function setOpacity(el: HTMLElement, opacity: Number)
	// Set the opacity of an element (including old IE support).
	// `opacity` must be a number from `0` to `1`.
	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {
			L.DomUtil._setOpacityIE(el, value);
		}
	},

	_setOpacityIE: function (el, value) {
		var filter = false,
		    filterName = 'DXImageTransform.Microsoft.Alpha';

		// filters collection throws an error if we try to retrieve a filter that doesn't exist
		try {
			filter = el.filters.item(filterName);
		} catch (e) {
			// don't set opacity to 1 if we haven't already set an opacity,
			// it isn't needed and breaks transparent pngs.
			if (value === 1) { return; }
		}

		value = Math.round(value * 100);

		if (filter) {
			filter.Enabled = (value !== 100);
			filter.Opacity = value;
		} else {
			el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
		}
	},

	// @function testProp(props: String[]): String|false
	// Goes through the array of style names and returns the first name
	// that is a valid style name for an element. If no such name is found,
	// it returns false. Useful for vendor-prefixed styles like `transform`.
	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	// @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
	// Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
	// and optionally scaled by `scale`. Does not have an effect if the
	// browser doesn't support 3D CSS transforms.
	setTransform: function (el, offset, scale) {
		var pos = offset || new L.Point(0, 0);

		el.style[L.DomUtil.TRANSFORM] =
			(L.Browser.ie3d ?
				'translate(' + pos.x + 'px,' + pos.y + 'px)' :
				'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
			(scale ? ' scale(' + scale + ')' : '');
	},

	// @function setPosition(el: HTMLElement, position: Point)
	// Sets the position of `el` to coordinates specified by `position`,
	// using CSS translate or top/left positioning depending on the browser
	// (used by Leaflet internally to position its layers).
	setPosition: function (el, point) { // (HTMLElement, Point[, Boolean])

		/*eslint-disable */
		el._leaflet_pos = point;
		/*eslint-enable */

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(el, point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	// @function getPosition(el: HTMLElement): Point
	// Returns the coordinates of an element previously positioned with setPosition.
	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		return el._leaflet_pos || new L.Point(0, 0);
	}
};


(function () {
	// prefix style property names

	// @property TRANSFORM: String
	// Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
	L.DomUtil.TRANSFORM = L.DomUtil.testProp(
			['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);


	// webkitTransition comes first because some browser versions that drop vendor prefix don't do
	// the same for the transitionend event, in particular the Android 4.1 stock browser

	// @property TRANSITION: String
	// Vendor-prefixed transform style name.
	var transition = L.DomUtil.TRANSITION = L.DomUtil.testProp(
			['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

	L.DomUtil.TRANSITION_END =
			transition === 'webkitTransition' || transition === 'OTransition' ? transition + 'End' : 'transitionend';

	// @function disableTextSelection()
	// Prevents the user from generating `selectstart` DOM events, usually generated
	// when the user drags the mouse through a page with text. Used internally
	// by Leaflet to override the behaviour of any click-and-drag interaction on
	// the map. Affects drag interactions on the whole document.

	// @function enableTextSelection()
	// Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).
	if ('onselectstart' in document) {
		L.DomUtil.disableTextSelection = function () {
			L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);
		};
		L.DomUtil.enableTextSelection = function () {
			L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);
		};

	} else {
		var userSelectProperty = L.DomUtil.testProp(
			['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

		L.DomUtil.disableTextSelection = function () {
			if (userSelectProperty) {
				var style = document.documentElement.style;
				this._userSelect = style[userSelectProperty];
				style[userSelectProperty] = 'none';
			}
		};
		L.DomUtil.enableTextSelection = function () {
			if (userSelectProperty) {
				document.documentElement.style[userSelectProperty] = this._userSelect;
				delete this._userSelect;
			}
		};
	}

	// @function disableImageDrag()
	// As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
	// for `dragstart` DOM events, usually generated when the user drags an image.
	L.DomUtil.disableImageDrag = function () {
		L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);
	};

	// @function enableImageDrag()
	// Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).
	L.DomUtil.enableImageDrag = function () {
		L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);
	};

	// @function preventOutline(el: HTMLElement)
	// Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
	// of the element `el` invisible. Used internally by Leaflet to prevent
	// focusable elements from displaying an outline when the user performs a
	// drag interaction on them.
	L.DomUtil.preventOutline = function (element) {
		while (element.tabIndex === -1) {
			element = element.parentNode;
		}
		if (!element || !element.style) { return; }
		L.DomUtil.restoreOutline();
		this._outlineElement = element;
		this._outlineStyle = element.style.outline;
		element.style.outline = 'none';
		L.DomEvent.on(window, 'keydown', L.DomUtil.restoreOutline, this);
	};

	// @function restoreOutline()
	// Cancels the effects of a previous [`L.DomUtil.preventOutline`]().
	L.DomUtil.restoreOutline = function () {
		if (!this._outlineElement) { return; }
		this._outlineElement.style.outline = this._outlineStyle;
		delete this._outlineElement;
		delete this._outlineStyle;
		L.DomEvent.off(window, 'keydown', L.DomUtil.restoreOutline, this);
	};
})();



/* @class LatLng
 * @aka L.LatLng
 *
 * Represents a geographical point with a certain latitude and longitude.
 *
 * @example
 *
 * ```
 * var latlng = L.latLng(50.5, 30.5);
 * ```
 *
 * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
 *
 * ```
 * map.panTo([50, 30]);
 * map.panTo({lon: 30, lat: 50});
 * map.panTo({lat: 50, lng: 30});
 * map.panTo(L.latLng(50, 30));
 * ```
 */

L.LatLng = function (lat, lng, alt) {
	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	// @property lat: Number
	// Latitude in degrees
	this.lat = +lat;

	// @property lng: Number
	// Longitude in degrees
	this.lng = +lng;

	// @property alt: Number
	// Altitude in meters (optional)
	if (alt !== undefined) {
		this.alt = +alt;
	}
};

L.LatLng.prototype = {
	// @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
	// Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overriden by setting `maxMargin` to a small number.
	equals: function (obj, maxMargin) {
		if (!obj) { return false; }

		obj = L.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
	},

	// @method toString(): String
	// Returns a string representation of the point (for debugging purposes).
	toString: function (precision) {
		return 'LatLng(' +
		        L.Util.formatNum(this.lat, precision) + ', ' +
		        L.Util.formatNum(this.lng, precision) + ')';
	},

	// @method distanceTo(otherLatLng: LatLng): Number
	// Returns the distance (in meters) to the given `LatLng` calculated using the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula).
	distanceTo: function (other) {
		return L.CRS.Earth.distance(this, L.latLng(other));
	},

	// @method wrap(): LatLng
	// Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
	wrap: function () {
		return L.CRS.Earth.wrapLatLng(this);
	},

	// @method toBounds(sizeInMeters: Number): LatLngBounds
	// Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters` meters apart from the `LatLng`.
	toBounds: function (sizeInMeters) {
		var latAccuracy = 180 * sizeInMeters / 40075017,
		    lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

		return L.latLngBounds(
		        [this.lat - latAccuracy, this.lng - lngAccuracy],
		        [this.lat + latAccuracy, this.lng + lngAccuracy]);
	},

	clone: function () {
		return new L.LatLng(this.lat, this.lng, this.alt);
	}
};



// @factory L.latLng(latitude: Number, longitude: Number, altitude?: Number): LatLng
// Creates an object representing a geographical point with the given latitude and longitude (and optionally altitude).

// @alternative
// @factory L.latLng(coords: Array): LatLng
// Expects an array of the form `[Number, Number]` or `[Number, Number, Number]` instead.

// @alternative
// @factory L.latLng(coords: Object): LatLng
// Expects an plain object of the form `{lat: Number, lng: Number}` or `{lat: Number, lng: Number, alt: Number}` instead.

L.latLng = function (a, b, c) {
	if (a instanceof L.LatLng) {
		return a;
	}
	if (L.Util.isArray(a) && typeof a[0] !== 'object') {
		if (a.length === 3) {
			return new L.LatLng(a[0], a[1], a[2]);
		}
		if (a.length === 2) {
			return new L.LatLng(a[0], a[1]);
		}
		return null;
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
	}
	if (b === undefined) {
		return null;
	}
	return new L.LatLng(a, b, c);
};



/*
 * @class LatLngBounds
 * @aka L.LatLngBounds
 *
 * Represents a rectangular geographical area on a map.
 *
 * @example
 *
 * ```js
 * var southWest = L.latLng(40.712, -74.227),
 * northEast = L.latLng(40.774, -74.125),
 * bounds = L.latLngBounds(southWest, northEast);
 * ```
 *
 * All Leaflet methods that accept LatLngBounds objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
 *
 * ```js
 * map.fitBounds([
 * 	[40.712, -74.227],
 * 	[40.774, -74.125]
 * ]);
 * ```
 */

L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

L.LatLngBounds.prototype = {

	// @method extend(latlng: LatLng): this
	// Extend the bounds to contain the given point

	// @alternative
	// @method extend(otherBounds: LatLngBounds): this
	// Extend the bounds to contain the given bounds
	extend: function (obj) {
		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLng) {
			sw2 = obj;
			ne2 = obj;

		} else if (obj instanceof L.LatLngBounds) {
			sw2 = obj._southWest;
			ne2 = obj._northEast;

			if (!sw2 || !ne2) { return this; }

		} else {
			return obj ? this.extend(L.latLng(obj) || L.latLngBounds(obj)) : this;
		}

		if (!sw && !ne) {
			this._southWest = new L.LatLng(sw2.lat, sw2.lng);
			this._northEast = new L.LatLng(ne2.lat, ne2.lng);
		} else {
			sw.lat = Math.min(sw2.lat, sw.lat);
			sw.lng = Math.min(sw2.lng, sw.lng);
			ne.lat = Math.max(ne2.lat, ne.lat);
			ne.lng = Math.max(ne2.lng, ne.lng);
		}

		return this;
	},

	// @method pad(bufferRatio: Number): LatLngBounds
	// Returns bigger bounds created by extending the current bounds by a given percentage in each direction.
	pad: function (bufferRatio) {
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new L.LatLngBounds(
		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	// @method getCenter(): LatLng
	// Returns the center point of the bounds.
	getCenter: function () {
		return new L.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	// @method getSouthWest(): LatLng
	// Returns the south-west point of the bounds.
	getSouthWest: function () {
		return this._southWest;
	},

	// @method getNorthEast(): LatLng
	// Returns the north-east point of the bounds.
	getNorthEast: function () {
		return this._northEast;
	},

	// @method getNorthWest(): LatLng
	// Returns the north-west point of the bounds.
	getNorthWest: function () {
		return new L.LatLng(this.getNorth(), this.getWest());
	},

	// @method getSouthEast(): LatLng
	// Returns the south-east point of the bounds.
	getSouthEast: function () {
		return new L.LatLng(this.getSouth(), this.getEast());
	},

	// @method getWest(): Number
	// Returns the west longitude of the bounds
	getWest: function () {
		return this._southWest.lng;
	},

	// @method getSouth(): Number
	// Returns the south latitude of the bounds
	getSouth: function () {
		return this._southWest.lat;
	},

	// @method getEast(): Number
	// Returns the east longitude of the bounds
	getEast: function () {
		return this._northEast.lng;
	},

	// @method getNorth(): Number
	// Returns the north latitude of the bounds
	getNorth: function () {
		return this._northEast.lat;
	},

	// @method contains(otherBounds: LatLngBounds): Boolean
	// Returns `true` if the rectangle contains the given one.

	// @alternative
	// @method contains (latlng: LatLng): Boolean
	// Returns `true` if the rectangle contains the given point.
	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {
			obj = L.latLng(obj);
		} else {
			obj = L.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	// @method intersects(otherBounds: LatLngBounds): Boolean
	// Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
	intersects: function (bounds) {
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	// @method overlaps(otherBounds: Bounds): Boolean
	// Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
	overlaps: function (bounds) {
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
		    lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);

		return latOverlaps && lngOverlaps;
	},

	// @method toBBoxString(): String
	// Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	// @method equals(otherBounds: LatLngBounds): Boolean
	// Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds.
	equals: function (bounds) {
		if (!bounds) { return false; }

		bounds = L.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	// @method isValid(): Boolean
	// Returns `true` if the bounds are properly initialized.
	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

// TODO International date line?

// @factory L.latLngBounds(southWest: LatLng, northEast: LatLng)
// Creates a `LatLngBounds` object by defining south-west and north-east corners of the rectangle.

// @alternative
// @factory L.latLngBounds(latlngs: LatLng[])
// Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).
L.latLngBounds = function (a, b) {
	if (a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
};



/*
 * @namespace Projection
 * @section
 * Leaflet comes with a set of already defined Projections out of the box:
 *
 * @projection L.Projection.LonLat
 *
 * Equirectangular, or Plate Carree projection — the most simple projection,
 * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
 * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
 * `EPSG:3395` and `Simple` CRS.
 */

L.Projection = {};

L.Projection.LonLat = {
	project: function (latlng) {
		return new L.Point(latlng.lng, latlng.lat);
	},

	unproject: function (point) {
		return new L.LatLng(point.y, point.x);
	},

	bounds: L.bounds([-180, -90], [180, 90])
};



/*
 * @namespace Projection
 * @projection L.Projection.SphericalMercator
 *
 * Spherical Mercator projection — the most common projection for online maps,
 * used by almost all free and commercial tile providers. Assumes that Earth is
 * a sphere. Used by the `EPSG:3857` CRS.
 */

L.Projection.SphericalMercator = {

	R: 6378137,
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) {
		var d = Math.PI / 180,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    sin = Math.sin(lat * d);

		return new L.Point(
				this.R * latlng.lng * d,
				this.R * Math.log((1 + sin) / (1 - sin)) / 2);
	},

	unproject: function (point) {
		var d = 180 / Math.PI;

		return new L.LatLng(
			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
			point.x * d / this.R);
	},

	bounds: (function () {
		var d = 6378137 * Math.PI;
		return L.bounds([-d, -d], [d, d]);
	})()
};



/*
 * @class CRS
 * @aka L.CRS
 * Abstract class that defines coordinate reference systems for projecting
 * geographical points into pixel (screen) coordinates and back (and to
 * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
 * [spatial reference system](http://en.wikipedia.org/wiki/Coordinate_reference_system).
 *
 * Leaflet defines the most usual CRSs by default. If you want to use a
 * CRS not defined by default, take a look at the
 * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
 */

L.CRS = {
	// @method latLngToPoint(latlng: LatLng, zoom: Number): Point
	// Projects geographical coordinates into pixel coordinates for a given zoom.
	latLngToPoint: function (latlng, zoom) {
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	// @method pointToLatLng(point: Point, zoom: Number): LatLng
	// The inverse of `latLngToPoint`. Projects pixel coordinates on a given
	// zoom into geographical coordinates.
	pointToLatLng: function (point, zoom) {
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	// @method project(latlng: LatLng): Point
	// Projects geographical coordinates into coordinates in units accepted for
	// this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
	project: function (latlng) {
		return this.projection.project(latlng);
	},

	// @method unproject(point: Point): LatLng
	// Given a projected coordinate returns the corresponding LatLng.
	// The inverse of `project`.
	unproject: function (point) {
		return this.projection.unproject(point);
	},

	// @method scale(zoom: Number): Number
	// Returns the scale used when transforming projected coordinates into
	// pixel coordinates for a particular zoom. For example, it returns
	// `256 * 2^zoom` for Mercator-based CRS.
	scale: function (zoom) {
		return 256 * Math.pow(2, zoom);
	},

	// @method zoom(scale: Number): Number
	// Inverse of `scale()`, returns the zoom level corresponding to a scale
	// factor of `scale`.
	zoom: function (scale) {
		return Math.log(scale / 256) / Math.LN2;
	},

	// @method getProjectedBounds(zoom: Number): Bounds
	// Returns the projection's bounds scaled and transformed for the provided `zoom`.
	getProjectedBounds: function (zoom) {
		if (this.infinite) { return null; }

		var b = this.projection.bounds,
		    s = this.scale(zoom),
		    min = this.transformation.transform(b.min, s),
		    max = this.transformation.transform(b.max, s);

		return L.bounds(min, max);
	},

	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
	// Returns the distance between two geographical coordinates.

	// @property code: String
	// Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
	//
	// @property wrapLng: Number[]
	// An array of two numbers defining whether the longitude (horizontal) coordinate
	// axis wraps around a given range and how. Defaults to `[-180, 180]` in most
	// geographical CRSs. If `undefined`, the longitude axis does not wrap around.
	//
	// @property wrapLat: Number[]
	// Like `wrapLng`, but for the latitude (vertical) axis.

	// wrapLng: [min, max],
	// wrapLat: [min, max],

	// @property infinite: Boolean
	// If true, the coordinate space will be unbounded (infinite in both axes)
	infinite: false,

	// @method wrapLatLng(latlng: LatLng): LatLng
	// Returns a `LatLng` where lat and lng has been wrapped according to the
	// CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
	wrapLatLng: function (latlng) {
		var lng = this.wrapLng ? L.Util.wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
		    lat = this.wrapLat ? L.Util.wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
		    alt = latlng.alt;

		return L.latLng(lat, lng, alt);
	}
};



/*
 * @namespace CRS
 * @crs L.CRS.Simple
 *
 * A simple CRS that maps longitude and latitude into `x` and `y` directly.
 * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
 * axis should still be inverted (going from bottom to top). `distance()` returns
 * simple euclidean distance.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	},

	zoom: function (scale) {
		return Math.log(scale) / Math.LN2;
	},

	distance: function (latlng1, latlng2) {
		var dx = latlng2.lng - latlng1.lng,
		    dy = latlng2.lat - latlng1.lat;

		return Math.sqrt(dx * dx + dy * dy);
	},

	infinite: true
});



/*
 * @namespace CRS
 * @crs L.CRS.Earth
 *
 * Serves as the base for CRS that are global such that they cover the earth.
 * Can only be used as the base for other CRS and cannot be used directly,
 * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
 * meters.
 */

L.CRS.Earth = L.extend({}, L.CRS, {
	wrapLng: [-180, 180],

	// Mean Earth Radius, as recommended for use by
	// the International Union of Geodesy and Geophysics,
	// see http://rosettacode.org/wiki/Haversine_formula
	R: 6371000,

	// distance between two geographical points using spherical law of cosines approximation
	distance: function (latlng1, latlng2) {
		var rad = Math.PI / 180,
		    lat1 = latlng1.lat * rad,
		    lat2 = latlng2.lat * rad,
		    a = Math.sin(lat1) * Math.sin(lat2) +
		        Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

		return this.R * Math.acos(Math.min(a, 1));
	}
});



/*
 * @namespace CRS
 * @crs L.CRS.EPSG3857
 *
 * The most common CRS for online maps, used by almost all free and commercial
 * tile providers. Uses Spherical Mercator projection. Set in by default in
 * Map's `crs` option.
 */

L.CRS.EPSG3857 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:3857',
	projection: L.Projection.SphericalMercator,

	transformation: (function () {
		var scale = 0.5 / (Math.PI * L.Projection.SphericalMercator.R);
		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});

L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
	code: 'EPSG:900913'
});



/*
 * @namespace CRS
 * @crs L.CRS.EPSG4326
 *
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 */

L.CRS.EPSG4326 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:4326',
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5)
});



/*
 * @class Map
 * @aka L.Map
 * @inherits Evented
 *
 * The central class of the API — it is used to create a map on a page and manipulate it.
 *
 * @example
 *
 * ```js
 * // initialize the map on the "map" div with a given center and zoom
 * var map = L.map('map', {
 * 	center: [51.505, -0.09],
 * 	zoom: 13
 * });
 * ```
 *
 */

L.Map = L.Evented.extend({

	options: {
		// @section Map State Options
		// @option crs: CRS = L.CRS.EPSG3857
		// The [Coordinate Reference System](#crs) to use. Don't change this if you're not
		// sure what it means.
		crs: L.CRS.EPSG3857,

		// @option center: LatLng = undefined
		// Initial geographic center of the map
		center: undefined,

		// @option zoom: Number = undefined
		// Initial map zoom level
		zoom: undefined,

		// @option minZoom: Number = undefined
		// Minimum zoom level of the map. Overrides any `minZoom` option set on map layers.
		minZoom: undefined,

		// @option maxZoom: Number = undefined
		// Maximum zoom level of the map. Overrides any `maxZoom` option set on map layers.
		maxZoom: undefined,

		// @option layers: Layer[] = []
		// Array of layers that will be added to the map initially
		layers: [],

		// @option maxBounds: LatLngBounds = null
		// When this option is set, the map restricts the view to the given
		// geographical bounds, bouncing the user back when he tries to pan
		// outside the view. To set the restriction dynamically, use
		// [`setMaxBounds`](#map-setmaxbounds) method.
		maxBounds: undefined,

		// @option renderer: Renderer = *
		// The default method for drawing vector layers on the map. `L.SVG`
		// or `L.Canvas` by default depending on browser support.
		renderer: undefined,


		// @section Animation Options
		// @option zoomAnimation: Boolean = true
		// Whether the map zoom animation is enabled. By default it's enabled
		// in all browsers that support CSS3 Transitions except Android.
		zoomAnimation: true,

		// @option zoomAnimationThreshold: Number = 4
		// Won't animate zoom if the zoom difference exceeds this value.
		zoomAnimationThreshold: 4,

		// @option fadeAnimation: Boolean = true
		// Whether the tile fade animation is enabled. By default it's enabled
		// in all browsers that support CSS3 Transitions except Android.
		fadeAnimation: true,

		// @option markerZoomAnimation: Boolean = true
		// Whether markers animate their zoom with the zoom animation, if disabled
		// they will disappear for the length of the animation. By default it's
		// enabled in all browsers that support CSS3 Transitions except Android.
		markerZoomAnimation: true,

		// @option transform3DLimit: Number = 2^23
		// Defines the maximum size of a CSS translation transform. The default
		// value should not be changed unless a web browser positions layers in
		// the wrong place after doing a large `panBy`.
		transform3DLimit: 8388608, // Precision limit of a 32-bit float

		// @section Interaction Options
		// @option zoomSnap: Number = 1
		// Forces the map's zoom level to always be a multiple of this, particularly
		// right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
		// By default, the zoom level snaps to the nearest integer; lower values
		// (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
		// means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
		zoomSnap: 1,

		// @option zoomDelta: Number = 1
		// Controls how much the map's zoom level will change after a
		// [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
		// or `-` on the keyboard, or using the [zoom controls](#control-zoom).
		// Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
		zoomDelta: 1,

		// @option trackResize: Boolean = true
		// Whether the map automatically handles browser window resize to update itself.
		trackResize: true
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.setOptions(this, options);

		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = L.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.zoom !== undefined) {
			this._zoom = this._limitZoom(options.zoom);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];
		this._layers = {};
		this._zoomBoundLayers = {};
		this._sizeChanged = true;

		this.callInitHooks();

		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = L.DomUtil.TRANSITION && L.Browser.any3d && !L.Browser.mobileOpera &&
				this.options.zoomAnimation;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			this._createAnimProxy();
			L.DomEvent.on(this._proxy, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}

		this._addLayers(this.options.layers);
	},


	// @section Methods for modifying map state

	// @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
	// Sets the view of the map (geographical center and zoom) with the given
	// animation options.
	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		this._stop();

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate, duration: options.duration}, options.pan);
			}

			// try animating pan or zoom
			var moved = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (moved) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	// @method setZoom(zoom: Number, options: Zoom/pan options): this
	// Sets the zoom of the map.
	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = zoom;
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	// @method zoomIn(delta?: Number, options?: Zoom options): this
	// Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	zoomIn: function (delta, options) {
		delta = delta || (L.Browser.any3d ? this.options.zoomDelta : 1);
		return this.setZoom(this._zoom + delta, options);
	},

	// @method zoomOut(delta?: Number, options?: Zoom options): this
	// Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	zoomOut: function (delta, options) {
		delta = delta || (L.Browser.any3d ? this.options.zoomDelta : 1);
		return this.setZoom(this._zoom - delta, options);
	},

	// @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
	// Zooms the map while keeping a specified geographical point on the map
	// stationary (e.g. used internally for scroll zoom and double-click zoom).
	// @alternative
	// @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
	// Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	_getBoundsCenterZoom: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

		zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;

		var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		return {
			center: center,
			zoom: zoom
		};
	},

	// @method fitBounds(bounds: LatLngBounds, options: fitBounds options): this
	// Sets a map view that contains the given geographical bounds with the
	// maximum zoom level possible.
	fitBounds: function (bounds, options) {

		bounds = L.latLngBounds(bounds);

		if (!bounds.isValid()) {
			throw new Error('Bounds are not valid.');
		}

		var target = this._getBoundsCenterZoom(bounds, options);
		return this.setView(target.center, target.zoom, options);
	},

	// @method fitWorld(options?: fitBounds options): this
	// Sets a map view that mostly contains the whole world with the maximum
	// zoom level possible.
	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	// @method panTo(latlng: LatLng, options?: Pan options): this
	// Pans the map to a given center.
	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	// @method panBy(offset: Point): this
	// Pans the map by a given number of pixels (animated).
	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this.fire('moveend');
		}
		// If we pan too far, Chrome gets issues with tiles
		// and makes them disappear or appear in the wrong place (slightly offset) #2602
		if (options.animate !== true && !this.getSize().contains(offset)) {
			this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset).round();
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	// @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
	// Sets the view of the map (geographical center and zoom) performing a smooth
	// pan-zoom animation.
	flyTo: function (targetCenter, targetZoom, options) {

		options = options || {};
		if (options.animate === false || !L.Browser.any3d) {
			return this.setView(targetCenter, targetZoom, options);
		}

		this._stop();

		var from = this.project(this.getCenter()),
		    to = this.project(targetCenter),
		    size = this.getSize(),
		    startZoom = this._zoom;

		targetCenter = L.latLng(targetCenter);
		targetZoom = targetZoom === undefined ? startZoom : targetZoom;

		var w0 = Math.max(size.x, size.y),
		    w1 = w0 * this.getZoomScale(startZoom, targetZoom),
		    u1 = (to.distanceTo(from)) || 1,
		    rho = 1.42,
		    rho2 = rho * rho;

		function r(i) {
			var s1 = i ? -1 : 1,
			    s2 = i ? w1 : w0,
			    t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
			    b1 = 2 * s2 * rho2 * u1,
			    b = t1 / b1,
			    sq = Math.sqrt(b * b + 1) - b;

			    // workaround for floating point precision bug when sq = 0, log = -Infinite,
			    // thus triggering an infinite loop in flyTo
			    var log = sq < 0.000000001 ? -18 : Math.log(sq);

			return log;
		}

		function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
		function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
		function tanh(n) { return sinh(n) / cosh(n); }

		var r0 = r(0);

		function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
		function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

		function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }

		var start = Date.now(),
		    S = (r(1) - r0) / rho,
		    duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

		function frame() {
			var t = (Date.now() - start) / duration,
			    s = easeOut(t) * S;

			if (t <= 1) {
				this._flyToFrame = L.Util.requestAnimFrame(frame, this);

				this._move(
					this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
					this.getScaleZoom(w0 / w(s), startZoom),
					{flyTo: true});

			} else {
				this
					._move(targetCenter, targetZoom)
					._moveEnd(true);
			}
		}

		this._moveStart(true);

		frame.call(this);
		return this;
	},

	// @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
	// Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
	// but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
	flyToBounds: function (bounds, options) {
		var target = this._getBoundsCenterZoom(bounds, options);
		return this.flyTo(target.center, target.zoom, options);
	},

	// @method setMaxBounds(bounds: Bounds): this
	// Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		if (!bounds.isValid()) {
			this.options.maxBounds = null;
			return this.off('moveend', this._panInsideMaxBounds);
		} else if (this.options.maxBounds) {
			this.off('moveend', this._panInsideMaxBounds);
		}

		this.options.maxBounds = bounds;

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds);
	},

	// @method setMinZoom(zoom: Number): this
	// Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
	setMinZoom: function (zoom) {
		this.options.minZoom = zoom;

		if (this._loaded && this.getZoom() < this.options.minZoom) {
			return this.setZoom(zoom);
		}

		return this;
	},

	// @method setMaxZoom(zoom: Number): this
	// Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
	setMaxZoom: function (zoom) {
		this.options.maxZoom = zoom;

		if (this._loaded && (this.getZoom() > this.options.maxZoom)) {
			return this.setZoom(zoom);
		}

		return this;
	},

	// @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
	// Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
	panInsideBounds: function (bounds, options) {
		this._enforcingBounds = true;
		var center = this.getCenter(),
		    newCenter = this._limitCenter(center, this._zoom, L.latLngBounds(bounds));

		if (!center.equals(newCenter)) {
			this.panTo(newCenter, options);
		}

		this._enforcingBounds = false;
		return this;
	},

	// @method invalidateSize(options: Zoom/Pan options): this
	// Checks if the map container size changed and updates the map if so —
	// call it after you've changed the map size dynamically, also animating
	// pan by default. If `options.pan` is `false`, panning will not occur.
	// If `options.debounceMoveend` is `true`, it will delay `moveend` event so
	// that it doesn't happen often even if the method is called many
	// times in a row.

	// @alternative
	// @method invalidateSize(animate: Boolean): this
	// Checks if the map container size changed and updates the map if so —
	// call it after you've changed the map size dynamically, also animating
	// pan by default.
	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = L.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		// @section Map state change events
		// @event resize: ResizeEvent
		// Fired when the map is resized.
		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	// @section Methods for modifying map state
	// @method stop(): this
	// Stops the currently running `panTo` or `flyTo` animation, if any.
	stop: function () {
		this.setZoom(this._limitZoom(this._zoom));
		if (!this.options.zoomSnap) {
			this.fire('viewreset');
		}
		return this._stop();
	},

	// @section Geolocation methods
	// @method locate(options?: Locate options): this
	// Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
	// event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
	// and optionally sets the map view to the user's location with respect to
	// detection accuracy (or to the world view if geolocation failed).
	// Note that, if your page doesn't use HTTPS, this method will fail in
	// modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
	// See `Locate options` for more details.
	locate: function (options) {

		options = this._locateOptions = L.extend({
			timeout: 10000,
			watch: false
			// setView: false
			// maxZoom: <Number>
			// maximumAge: 0
			// enableHighAccuracy: false
		}, options);

		if (!('geolocation' in navigator)) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
		    onError = L.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	// @method stopLocate(): this
	// Stops watching location previously initiated by `map.locate({watch: true})`
	// and aborts resetting the map view if map.locate was called with
	// `{setView: true}`.
	stopLocate: function () {
		if (navigator.geolocation && navigator.geolocation.clearWatch) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		// @section Location events
		// @event locationerror: ErrorEvent
		// Fired when geolocation (using the [`locate`](#map-locate) method) failed.
		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new L.LatLng(lat, lng),
		    bounds = latlng.toBounds(pos.coords.accuracy),
		    options = this._locateOptions;

		if (options.setView) {
			var zoom = this.getBoundsZoom(bounds);
			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		// @event locationfound: LocationEvent
		// Fired when geolocation (using the [`locate`](#map-locate) method)
		// went successfully.
		this.fire('locationfound', data);
	},

	// TODO handler.addTo
	// TODO Appropiate docs section?
	// @section Other Methods
	// @method addHandler(name: String, HandlerClass: Function): this
	// Adds a new `Handler` to the map, given its name and constructor function.
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	// @method remove(): this
	// Destroys the map and clears all related event listeners.
	remove: function () {

		this._initEvents(true);

		if (this._containerId !== this._container._leaflet_id) {
			throw new Error('Map container is being reused by another instance');
		}

		try {
			// throws error in IE6-8
			delete this._container._leaflet_id;
			delete this._containerId;
		} catch (e) {
			/*eslint-disable */
			this._container._leaflet_id = undefined;
			/*eslint-enable */
			this._containerId = undefined;
		}

		L.DomUtil.remove(this._mapPane);

		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		if (this._loaded) {
			// @section Map state change events
			// @event unload: Event
			// Fired when the map is destroyed with [remove](#map-remove) method.
			this.fire('unload');
		}

		for (var i in this._layers) {
			this._layers[i].remove();
		}

		return this;
	},

	// @section Other Methods
	// @method createPane(name: String, container?: HTMLElement): HTMLElement
	// Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
	// then returns it. The pane is created as a children of `container`, or
	// as a children of the main map pane if not set.
	createPane: function (name, container) {
		var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
		    pane = L.DomUtil.create('div', className, container || this._mapPane);

		if (name) {
			this._panes[name] = pane;
		}
		return pane;
	},

	// @section Methods for Getting Map State

	// @method getCenter(): LatLng
	// Returns the geographical center of the map view
	getCenter: function () {
		this._checkIfLoaded();

		if (this._lastCenter && !this._moved()) {
			return this._lastCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	// @method getZoom(): Number
	// Returns the current zoom level of the map view
	getZoom: function () {
		return this._zoom;
	},

	// @method getBounds(): LatLngBounds
	// Returns the geographical bounds visible in the current map view
	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	// @method getMinZoom(): Number
	// Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
	getMinZoom: function () {
		return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
	},

	// @method getMaxZoom(): Number
	// Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	// @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean): Number
	// Returns the maximum zoom level on which the given bounds fit to the map
	// view in its entirety. If `inside` (optional) is set to `true`, the method
	// instead returns the minimum zoom level on which the map view fits into
	// the given bounds in its entirety.
	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = L.latLngBounds(bounds);
		padding = L.point(padding || [0, 0]);

		var zoom = this.getZoom() || 0,
		    min = this.getMinZoom(),
		    max = this.getMaxZoom(),
		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),
		    size = this.getSize().subtract(padding),
		    boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)),
		    snap = L.Browser.any3d ? this.options.zoomSnap : 1;

		var scale = Math.min(size.x / boundsSize.x, size.y / boundsSize.y);
		zoom = this.getScaleZoom(scale, zoom);

		if (snap) {
			zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
			zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
		}

		return Math.max(min, Math.min(max, zoom));
	},

	// @method getSize(): Point
	// Returns the current size of the map container (in pixels).
	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	// @method getPixelBounds(): Bounds
	// Returns the bounds of the current map view in projected pixel
	// coordinates (sometimes useful in layer and overlay implementations).
	getPixelBounds: function (center, zoom) {
		var topLeftPoint = this._getTopLeftPoint(center, zoom);
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	// TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
	// the map pane? "left point of the map layer" can be confusing, specially
	// since there can be negative offsets.
	// @method getPixelOrigin(): Point
	// Returns the projected pixel coordinates of the top left point of
	// the map layer (useful in custom layer and overlay implementations).
	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._pixelOrigin;
	},

	// @method getPixelWorldBounds(zoom?: Number): Bounds
	// Returns the world's bounds in pixel coordinates for zoom level `zoom`.
	// If `zoom` is omitted, the map's current zoom level is used.
	getPixelWorldBounds: function (zoom) {
		return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
	},

	// @section Other Methods

	// @method getPane(pane: String|HTMLElement): HTMLElement
	// Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
	getPane: function (pane) {
		return typeof pane === 'string' ? this._panes[pane] : pane;
	},

	// @method getPanes(): Object
	// Returns a plain object containing the names of all [panes](#map-pane) as keys and
	// the panes as values.
	getPanes: function () {
		return this._panes;
	},

	// @method getContainer: HTMLElement
	// Returns the HTML element that contains the map.
	getContainer: function () {
		return this._container;
	},


	// @section Conversion Methods

	// @method getZoomScale(toZoom: Number, fromZoom: Number): Number
	// Returns the scale factor to be applied to a map transition from zoom level
	// `fromZoom` to `toZoom`. Used internally to help with zoom animations.
	getZoomScale: function (toZoom, fromZoom) {
		// TODO replace with universal implementation after refactoring projections
		var crs = this.options.crs;
		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
		return crs.scale(toZoom) / crs.scale(fromZoom);
	},

	// @method getScaleZoom(scale: Number, fromZoom: Number): Number
	// Returns the zoom level that the map would end up at, if it is at `fromZoom`
	// level and everything is scaled by a factor of `scale`. Inverse of
	// [`getZoomScale`](#map-getZoomScale).
	getScaleZoom: function (scale, fromZoom) {
		var crs = this.options.crs;
		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
		var zoom = crs.zoom(scale * crs.scale(fromZoom));
		return isNaN(zoom) ? Infinity : zoom;
	},

	// @method project(latlng: LatLng, zoom: Number): Point
	// Projects a geographical coordinate `LatLng` according to the projection
	// of the map's CRS, then scales it according to `zoom` and the CRS's
	// `Transformation`. The result is pixel coordinate relative to
	// the CRS origin.
	project: function (latlng, zoom) {
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},

	// @method unproject(point: Point, zoom: Number): LatLng
	// Inverse of [`project`](#map-project).
	unproject: function (point, zoom) {
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	// @method layerPointToLatLng(point: Point): LatLng
	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	// returns the corresponding geographical coordinate (for the current zoom level).
	layerPointToLatLng: function (point) {
		var projectedPoint = L.point(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	},

	// @method latLngToLayerPoint(latlng: LatLng): Point
	// Given a geographical coordinate, returns the corresponding pixel coordinate
	// relative to the [origin pixel](#map-getpixelorigin).
	latLngToLayerPoint: function (latlng) {
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	},

	// @method wrapLatLng(latlng: LatLng): LatLng
	// Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
	// map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
	// CRS's bounds.
	// By default this means longitude is wrapped around the dateline so its
	// value is between -180 and +180 degrees.
	wrapLatLng: function (latlng) {
		return this.options.crs.wrapLatLng(L.latLng(latlng));
	},

	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
	// Returns the distance between two geographical coordinates according to
	// the map's CRS. By default this measures distance in meters.
	distance: function (latlng1, latlng2) {
		return this.options.crs.distance(L.latLng(latlng1), L.latLng(latlng2));
	},

	// @method containerPointToLayerPoint(point: Point): Point
	// Given a pixel coordinate relative to the map container, returns the corresponding
	// pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	// @method layerPointToContainerPoint(point: Point): Point
	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	// returns the corresponding pixel coordinate relative to the map container.
	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	// @method containerPointToLatLng(point: Point): Point
	// Given a pixel coordinate relative to the map container, returns
	// the corresponding geographical coordinate (for the current zoom level).
	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	// @method latLngToContainerPoint(latlng: LatLng): Point
	// Given a geographical coordinate, returns the corresponding pixel coordinate
	// relative to the map container.
	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	// @method mouseEventToContainerPoint(ev: MouseEvent): Point
	// Given a MouseEvent object, returns the pixel coordinate relative to the
	// map container where the event took place.
	mouseEventToContainerPoint: function (e) {
		return L.DomEvent.getMousePosition(e, this._container);
	},

	// @method mouseEventToLayerPoint(ev: MouseEvent): Point
	// Given a MouseEvent object, returns the pixel coordinate relative to
	// the [origin pixel](#map-getpixelorigin) where the event took place.
	mouseEventToLayerPoint: function (e) {
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	// @method mouseEventToLatLng(ev: MouseEvent): LatLng
	// Given a MouseEvent object, returns geographical coordinate where the
	// event took place.
	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet_id) {
			throw new Error('Map container is already initialized.');
		}

		L.DomEvent.addListener(container, 'scroll', this._onScroll, this);
		this._containerId = L.Util.stamp(container);
	},

	_initLayout: function () {
		var container = this._container;

		this._fadeAnimated = this.options.fadeAnimation && L.Browser.any3d;

		L.DomUtil.addClass(container, 'leaflet-container' +
			(L.Browser.touch ? ' leaflet-touch' : '') +
			(L.Browser.retina ? ' leaflet-retina' : '') +
			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(L.Browser.safari ? ' leaflet-safari' : '') +
			(this._fadeAnimated ? ' leaflet-fade-anim' : ''));

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};
		this._paneRenderers = {};

		// @section
		//
		// Panes are DOM elements used to control the ordering of layers on the map. You
		// can access panes with [`map.getPane`](#map-getpane) or
		// [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
		// [`map.createPane`](#map-createpane) method.
		//
		// Every map has the following default panes that differ only in zIndex.
		//
		// @pane mapPane: HTMLElement = 'auto'
		// Pane that contains all other map panes

		this._mapPane = this.createPane('mapPane', this._container);
		L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

		// @pane tilePane: HTMLElement = 200
		// Pane for `GridLayer`s and `TileLayer`s
		this.createPane('tilePane');
		// @pane overlayPane: HTMLElement = 400
		// Pane for vector overlays (`Path`s), like `Polyline`s and `Polygon`s
		this.createPane('shadowPane');
		// @pane shadowPane: HTMLElement = 500
		// Pane for overlay shadows (e.g. `Marker` shadows)
		this.createPane('overlayPane');
		// @pane markerPane: HTMLElement = 600
		// Pane for `Icon`s of `Marker`s
		this.createPane('markerPane');
		// @pane tooltipPane: HTMLElement = 650
		// Pane for tooltip.
		this.createPane('tooltipPane');
		// @pane popupPane: HTMLElement = 700
		// Pane for `Popup`s.
		this.createPane('popupPane');

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, 'leaflet-zoom-hide');
			L.DomUtil.addClass(panes.shadowPane, 'leaflet-zoom-hide');
		}
	},


	// private methods that modify map state

	// @section Map state change events
	_resetView: function (center, zoom) {
		L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

		var loading = !this._loaded;
		this._loaded = true;
		zoom = this._limitZoom(zoom);

		this.fire('viewprereset');

		var zoomChanged = this._zoom !== zoom;
		this
			._moveStart(zoomChanged)
			._move(center, zoom)
			._moveEnd(zoomChanged);

		// @event viewreset: Event
		// Fired when the map needs to redraw its content (this usually happens
		// on map zoom or load). Very useful for creating custom overlays.
		this.fire('viewreset');

		// @event load: Event
		// Fired when the map is initialized (when its center and zoom are set
		// for the first time).
		if (loading) {
			this.fire('load');
		}
	},

	_moveStart: function (zoomChanged) {
		// @event zoomstart: Event
		// Fired when the map zoom is about to change (e.g. before zoom animation).
		// @event movestart: Event
		// Fired when the view of the map starts changing (e.g. user starts dragging the map).
		if (zoomChanged) {
			this.fire('zoomstart');
		}
		return this.fire('movestart');
	},

	_move: function (center, zoom, data) {
		if (zoom === undefined) {
			zoom = this._zoom;
		}
		var zoomChanged = this._zoom !== zoom;

		this._zoom = zoom;
		this._lastCenter = center;
		this._pixelOrigin = this._getNewPixelOrigin(center);

		// @event zoom: Event
		// Fired repeatedly during any change in zoom level, including zoom
		// and fly animations.
		if (zoomChanged || (data && data.pinch)) {	// Always fire 'zoom' if pinching because #3530
			this.fire('zoom', data);
		}

		// @event move: Event
		// Fired repeatedly during any movement of the map, including pan and
		// fly animations.
		return this.fire('move', data);
	},

	_moveEnd: function (zoomChanged) {
		// @event zoomend: Event
		// Fired when the map has changed, after any animations.
		if (zoomChanged) {
			this.fire('zoomend');
		}

		// @event moveend: Event
		// Fired when the center of the map stops changing (e.g. user stopped
		// dragging the map).
		return this.fire('moveend');
	},

	_stop: function () {
		L.Util.cancelAnimFrame(this._flyToFrame);
		if (this._panAnim) {
			this._panAnim.stop();
		}
		return this;
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_panInsideMaxBounds: function () {
		if (!this._enforcingBounds) {
			this.panInsideBounds(this.options.maxBounds);
		}
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// DOM event handling

	// @section Interaction events
	_initEvents: function (remove) {
		if (!L.DomEvent) { return; }

		this._targets = {};
		this._targets[L.stamp(this._container)] = this;

		var onOff = remove ? 'off' : 'on';

		// @event click: MouseEvent
		// Fired when the user clicks (or taps) the map.
		// @event dblclick: MouseEvent
		// Fired when the user double-clicks (or double-taps) the map.
		// @event mousedown: MouseEvent
		// Fired when the user pushes the mouse button on the map.
		// @event mouseup: MouseEvent
		// Fired when the user releases the mouse button on the map.
		// @event mouseover: MouseEvent
		// Fired when the mouse enters the map.
		// @event mouseout: MouseEvent
		// Fired when the mouse leaves the map.
		// @event mousemove: MouseEvent
		// Fired while the mouse moves over the map.
		// @event contextmenu: MouseEvent
		// Fired when the user pushes the right mouse button on the map, prevents
		// default browser context menu from showing if there are listeners on
		// this event. Also fired on mobile when the user holds a single touch
		// for a second (also called long press).
		// @event keypress: KeyboardEvent
		// Fired when the user presses a key from the keyboard while the map is focused.
		L.DomEvent[onOff](this._container, 'click dblclick mousedown mouseup ' +
			'mouseover mouseout mousemove contextmenu keypress', this._handleDOMEvent, this);

		if (this.options.trackResize) {
			L.DomEvent[onOff](window, 'resize', this._onResize, this);
		}

		if (L.Browser.any3d && this.options.transform3DLimit) {
			this[onOff]('moveend', this._onMoveEnd);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this);
	},

	_onScroll: function () {
		this._container.scrollTop  = 0;
		this._container.scrollLeft = 0;
	},

	_onMoveEnd: function () {
		var pos = this._getMapPanePos();
		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
			// a pixel offset on very high values, see: http://jsfiddle.net/dg6r5hhb/
			this._resetView(this.getCenter(), this.getZoom());
		}
	},

	_findEventTargets: function (e, type) {
		var targets = [],
		    target,
		    isHover = type === 'mouseout' || type === 'mouseover',
		    src = e.target || e.srcElement,
		    dragging = false;

		while (src) {
			target = this._targets[L.stamp(src)];
			if (target && (type === 'click' || type === 'preclick') && !e._simulated && this._draggableMoved(target)) {
				// Prevent firing click after you just dragged an object.
				dragging = true;
				break;
			}
			if (target && target.listens(type, true)) {
				if (isHover && !L.DomEvent._isExternalTarget(src, e)) { break; }
				targets.push(target);
				if (isHover) { break; }
			}
			if (src === this._container) { break; }
			src = src.parentNode;
		}
		if (!targets.length && !dragging && !isHover && L.DomEvent._isExternalTarget(src, e)) {
			targets = [this];
		}
		return targets;
	},

	_handleDOMEvent: function (e) {
		if (!this._loaded || L.DomEvent._skipped(e)) { return; }

		var type = e.type === 'keypress' && e.keyCode === 13 ? 'click' : e.type;

		if (type === 'mousedown') {
			// prevents outline when clicking on keyboard-focusable element
			L.DomUtil.preventOutline(e.target || e.srcElement);
		}

		this._fireDOMEvent(e, type);
	},

	_fireDOMEvent: function (e, type, targets) {

		if (e.type === 'click') {
			// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
			// @event preclick: MouseEvent
			// Fired before mouse click on the map (sometimes useful when you
			// want something to happen on click before any existing click
			// handlers start running).
			var synth = L.Util.extend({}, e);
			synth.type = 'preclick';
			this._fireDOMEvent(synth, synth.type, targets);
		}

		if (e._stopped) { return; }

		// Find the layer the event is propagating from and its parents.
		targets = (targets || []).concat(this._findEventTargets(e, type));

		if (!targets.length) { return; }

		var target = targets[0];
		if (type === 'contextmenu' && target.listens(type, true)) {
			L.DomEvent.preventDefault(e);
		}

		var data = {
			originalEvent: e
		};

		if (e.type !== 'keypress') {
			var isMarker = target instanceof L.Marker;
			data.containerPoint = isMarker ?
					this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
		}

		for (var i = 0; i < targets.length; i++) {
			targets[i].fire(type, data, true);
			if (data.originalEvent._stopped ||
				(targets[i].options.nonBubblingEvents && L.Util.indexOf(targets[i].options.nonBubblingEvents, type) !== -1)) { return; }
		}
	},

	_draggableMoved: function (obj) {
		obj = obj.dragging && obj.dragging.enabled() ? obj : this;
		return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	// @section Other Methods

	// @method whenReady(fn: Function, context?: Object): this
	// Runs the given function `fn` when the map gets initialized with
	// a view (center and zoom) and at least one layer, or immediately
	// if it's already initialized, optionally passing a function context.
	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, {target: this});
		} else {
			this.on('load', callback, context);
		}
		return this;
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane) || new L.Point(0, 0);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function (center, zoom) {
		var pixelOrigin = center && zoom !== undefined ?
			this._getNewPixelOrigin(center, zoom) :
			this.getPixelOrigin();
		return pixelOrigin.subtract(this._getMapPanePos());
	},

	_getNewPixelOrigin: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
	},

	_latLngToNewLayerPoint: function (latlng, zoom, center) {
		var topLeft = this._getNewPixelOrigin(center, zoom);
		return this.project(latlng, zoom)._subtract(topLeft);
	},

	_latLngBoundsToNewLayerBounds: function (latLngBounds, zoom, center) {
		var topLeft = this._getNewPixelOrigin(center, zoom);
		return L.bounds([
			this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
		]);
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		// If offset is less than a pixel, ignore.
		// This prevents unstable projections from getting into
		// an infinite loop of tiny offsets.
		if (offset.round().equals([0, 0])) {
			return center;
		}

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var projectedMaxBounds = L.bounds(
		        this.project(maxBounds.getNorthEast(), zoom),
		        this.project(maxBounds.getSouthWest(), zoom)
		    ),
		    minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
		    maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),

		    dx = this._rebound(minOffset.x, -maxOffset.x),
		    dy = this._rebound(minOffset.y, -maxOffset.y);

		return new L.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom(),
		    snap = L.Browser.any3d ? this.options.zoomSnap : 1;
		if (snap) {
			zoom = Math.round(zoom / snap) * snap;
		}
		return Math.max(min, Math.min(max, zoom));
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	},

	_createAnimProxy: function () {

		var proxy = this._proxy = L.DomUtil.create('div', 'leaflet-proxy leaflet-zoom-animated');
		this._panes.mapPane.appendChild(proxy);

		this.on('zoomanim', function (e) {
			var prop = L.DomUtil.TRANSFORM,
			    transform = proxy.style[prop];

			L.DomUtil.setTransform(proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

			// workaround for case when transform is the same and so transitionend event is not fired
			if (transform === proxy.style[prop] && this._animatingZoom) {
				this._onZoomTransitionEnd();
			}
		}, this);

		this.on('load moveend', function () {
			var c = this.getCenter(),
			    z = this.getZoom();
			L.DomUtil.setTransform(proxy, this.project(c, z), this.getZoomScale(z, 1));
		}, this);
	},

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		L.Util.requestAnimFrame(function () {
			this
			    ._moveStart(true)
			    ._animateZoom(center, zoom, true);
		}, this);

		return true;
	},

	_animateZoom: function (center, zoom, startAnim, noUpdate) {
		if (startAnim) {
			this._animatingZoom = true;

			// remember what center/zoom to set after animation
			this._animateToCenter = center;
			this._animateToZoom = zoom;

			L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');
		}

		// @event zoomanim: ZoomAnimEvent
		// Fired on every frame of a zoom animation
		this.fire('zoomanim', {
			center: center,
			zoom: zoom,
			noUpdate: noUpdate
		});

		// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
		setTimeout(L.bind(this._onZoomTransitionEnd, this), 250);
	},

	_onZoomTransitionEnd: function () {
		if (!this._animatingZoom) { return; }

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._animatingZoom = false;

		this._move(this._animateToCenter, this._animateToZoom);

		// This anim frame should prevent an obscure iOS webkit tile loading race condition.
		L.Util.requestAnimFrame(function () {
			this._moveEnd(true);
		}, this);
	}
});

// @section

// @factory L.map(id: String, options?: Map options)
// Instantiates a map object given the DOM ID of a `<div>` element
// and optionally an object literal with `Map options`.
//
// @alternative
// @factory L.map(el: HTMLElement, options?: Map options)
// Instantiates a map object given an instance of a `<div>` HTML element
// and optionally an object literal with `Map options`.
L.map = function (id, options) {
	return new L.Map(id, options);
};




/*
 * @class Layer
 * @inherits Evented
 * @aka L.Layer
 * @aka ILayer
 *
 * A set of methods from the Layer base class that all Leaflet layers use.
 * Inherits all methods, options and events from `L.Evented`.
 *
 * @example
 *
 * ```js
 * var layer = L.Marker(latlng).addTo(map);
 * layer.addTo(map);
 * layer.remove();
 * ```
 *
 * @event add: Event
 * Fired after the layer is added to a map
 *
 * @event remove: Event
 * Fired after the layer is removed from a map
 */


L.Layer = L.Evented.extend({

	// Classes extending `L.Layer` will inherit the following options:
	options: {
		// @option pane: String = 'overlayPane'
		// By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
		pane: 'overlayPane',
		nonBubblingEvents: []  // Array of events that should not be bubbled to DOM parents (like the map)
	},

	/* @section
	 * Classes extending `L.Layer` will inherit the following methods:
	 *
	 * @method addTo(map: Map): this
	 * Adds the layer to the given map
	 */
	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	// @method remove: this
	// Removes the layer from the map it is currently active on.
	remove: function () {
		return this.removeFrom(this._map || this._mapToAdd);
	},

	// @method removeFrom(map: Map): this
	// Removes the layer from the given map
	removeFrom: function (obj) {
		if (obj) {
			obj.removeLayer(this);
		}
		return this;
	},

	// @method getPane(name? : String): HTMLElement
	// Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
	getPane: function (name) {
		return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
	},

	addInteractiveTarget: function (targetEl) {
		this._map._targets[L.stamp(targetEl)] = this;
		return this;
	},

	removeInteractiveTarget: function (targetEl) {
		delete this._map._targets[L.stamp(targetEl)];
		return this;
	},

	_layerAdd: function (e) {
		var map = e.target;

		// check in case layer gets added and then removed before the map is ready
		if (!map.hasLayer(this)) { return; }

		this._map = map;
		this._zoomAnimated = map._zoomAnimated;

		if (this.getEvents) {
			var events = this.getEvents();
			map.on(events, this);
			this.once('remove', function () {
				map.off(events, this);
			}, this);
		}

		this.onAdd(map);

		if (this.getAttribution && this._map.attributionControl) {
			this._map.attributionControl.addAttribution(this.getAttribution());
		}

		this.fire('add');
		map.fire('layeradd', {layer: this});
	}
});

/* @section Extension methods
 * @uninheritable
 *
 * Every layer should extend from `L.Layer` and (re-)implement the following methods.
 *
 * @method onAdd(map: Map): this
 * Should contain code that creates DOM elements for the layer, adds them to `map panes` where they should belong and puts listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
 *
 * @method onRemove(map: Map): this
 * Should contain all clean up code that removes the layer's elements from the DOM and removes listeners previously added in [`onAdd`](#layer-onadd). Called on [`map.removeLayer(layer)`](#map-removelayer).
 *
 * @method getEvents(): Object
 * This optional method should return an object like `{ viewreset: this._reset }` for [`addEventListener`](#evented-addeventlistener). The event handlers in this object will be automatically added and removed from the map with your layer.
 *
 * @method getAttribution(): String
 * This optional method should return a string containing HTML to be shown on the `Attribution control` whenever the layer is visible.
 *
 * @method beforeAdd(map: Map): this
 * Optional method. Called on [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before events are initialized, without waiting until the map is in a usable state. Use for early initialization only.
 */


/* @namespace Map
 * @section Layer events
 *
 * @event layeradd: LayerEvent
 * Fired when a new layer is added to the map.
 *
 * @event layerremove: LayerEvent
 * Fired when some layer is removed from the map
 *
 * @section Methods for Layers and Controls
 */
L.Map.include({
	// @method addLayer(layer: Layer): this
	// Adds the given layer to the map
	addLayer: function (layer) {
		var id = L.stamp(layer);
		if (this._layers[id]) { return this; }
		this._layers[id] = layer;

		layer._mapToAdd = this;

		if (layer.beforeAdd) {
			layer.beforeAdd(this);
		}

		this.whenReady(layer._layerAdd, layer);

		return this;
	},

	// @method removeLayer(layer: Layer): this
	// Removes the given layer from the map.
	removeLayer: function (layer) {
		var id = L.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		if (layer.getAttribution && this.attributionControl) {
			this.attributionControl.removeAttribution(layer.getAttribution());
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
			layer.fire('remove');
		}

		layer._map = layer._mapToAdd = null;

		return this;
	},

	// @method hasLayer(layer: Layer): Boolean
	// Returns `true` if the given layer is currently added to the map
	hasLayer: function (layer) {
		return !!layer && (L.stamp(layer) in this._layers);
	},

	/* @method eachLayer(fn: Function, context?: Object): this
	 * Iterates over the layers of the map, optionally specifying context of the iterator function.
	 * ```
	 * map.eachLayer(function(layer){
	 *     layer.bindPopup('Hello');
	 * });
	 * ```
	 */
	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	_addLayers: function (layers) {
		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},

	_addZoomLimit: function (layer) {
		if (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
			this._zoomBoundLayers[L.stamp(layer)] = layer;
			this._updateZoomLevels();
		}
	},

	_removeZoomLimit: function (layer) {
		var id = L.stamp(layer);

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}
	},

	_updateZoomLevels: function () {
		var minZoom = Infinity,
		    maxZoom = -Infinity,
		    oldZoomSpan = this._getZoomSpan();

		for (var i in this._zoomBoundLayers) {
			var options = this._zoomBoundLayers[i].options;

			minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
			maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
		}

		this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
		this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

		// @section Map state change events
		// @event zoomlevelschange: Event
		// Fired when the number of zoomlevels on the map is changed due
		// to adding or removing a layer.
		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	}
});



/*
 * @namespace DomEvent
 * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
 */

// Inspired by John Resig, Dean Edwards and YUI addEvent implementations.



var eventsKey = '_leaflet_events';

L.DomEvent = {

	// @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
	// Adds a listener function (`fn`) to a particular DOM event type of the
	// element `el`. You can optionally specify the context of the listener
	// (object the `this` keyword will point to). You can also pass several
	// space-separated types (e.g. `'click dblclick'`).

	// @alternative
	// @function on(el: HTMLElement, eventMap: Object, context?: Object): this
	// Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	on: function (obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this._on(obj, type, types[type], fn);
			}
		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(obj, types[i], fn, context);
			}
		}

		return this;
	},

	// @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
	// Removes a previously added listener function. If no function is specified,
	// it will remove all the listeners of that particular DOM event from the element.
	// Note that if you passed a custom context to on, you must pass the same
	// context to `off` in order to remove the listener.

	// @alternative
	// @function off(el: HTMLElement, eventMap: Object, context?: Object): this
	// Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	off: function (obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this._off(obj, type, types[type], fn);
			}
		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(obj, types[i], fn, context);
			}
		}

		return this;
	},

	_on: function (obj, type, fn, context) {
		var id = type + L.stamp(fn) + (context ? '_' + L.stamp(context) : '');

		if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

		var handler = function (e) {
			return fn.call(context || obj, e || window.event);
		};

		var originalHandler = handler;

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.addPointerListener(obj, type, handler, id);

		} else if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);

		} else if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				handler = function (e) {
					e = e || window.event;
					if (L.DomEvent._isExternalTarget(obj, e)) {
						originalHandler(e);
					}
				};
				obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false);

			} else {
				if (type === 'click' && L.Browser.android) {
					handler = function (e) {
						return L.DomEvent._filterClick(e, originalHandler);
					};
				}
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[eventsKey] = obj[eventsKey] || {};
		obj[eventsKey][id] = handler;

		return this;
	},

	_off: function (obj, type, fn, context) {

		var id = type + L.stamp(fn) + (context ? '_' + L.stamp(context) : ''),
		    handler = obj[eventsKey] && obj[eventsKey][id];

		if (!handler) { return this; }

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);

		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false);

			} else {
				obj.removeEventListener(
					type === 'mouseenter' ? 'mouseover' :
					type === 'mouseleave' ? 'mouseout' : type, handler, false);
			}

		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[eventsKey][id] = null;

		return this;
	},

	// @function stopPropagation(ev: DOMEvent): this
	// Stop the given event from propagation to parent elements. Used inside the listener functions:
	// ```js
	// L.DomEvent.on(div, 'click', function (ev) {
	// 	L.DomEvent.stopPropagation(ev);
	// });
	// ```
	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else if (e.originalEvent) {  // In case of Leaflet event.
			e.originalEvent._stopped = true;
		} else {
			e.cancelBubble = true;
		}
		L.DomEvent._skipped(e);

		return this;
	},

	// @function disableScrollPropagation(el: HTMLElement): this
	// Adds `stopPropagation` to the element's `'mousewheel'` events (plus browser variants).
	disableScrollPropagation: function (el) {
		return L.DomEvent.on(el, 'mousewheel', L.DomEvent.stopPropagation);
	},

	// @function disableClickPropagation(el: HTMLElement): this
	// Adds `stopPropagation` to the element's `'click'`, `'doubleclick'`,
	// `'mousedown'` and `'touchstart'` events (plus browser variants).
	disableClickPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		L.DomEvent.on(el, L.Draggable.START.join(' '), stop);

		return L.DomEvent.on(el, {
			click: L.DomEvent._fakeStop,
			dblclick: stop
		});
	},

	// @function preventDefault(ev: DOMEvent): this
	// Prevents the default action of the DOM Event `ev` from happening (such as
	// following a link in the href of the a element, or doing a POST request
	// with page reload when a `<form>` is submitted).
	// Use it inside listener functions.
	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	// @function stop(ev): this
	// Does `stopPropagation` and `preventDefault` at the same time.
	stop: function (e) {
		return L.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	// @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
	// Gets normalized mouse position from a DOM event relative to the
	// `container` or to the whole page if not specified.
	getMousePosition: function (e, container) {
		if (!container) {
			return new L.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new L.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	// Chrome on Win scrolls double the pixels as in other platforms (see #4538),
	// and Firefox scrolls device pixels, not CSS pixels
	_wheelPxFactor: (L.Browser.win && L.Browser.chrome) ? 2 :
	                L.Browser.gecko ? window.devicePixelRatio :
	                1,

	// @function getWheelDelta(ev: DOMEvent): Number
	// Gets normalized wheel delta from a mousewheel DOM event, in vertical
	// pixels scrolled (negative if scrolling down).
	// Events from pointing devices without precise scrolling are mapped to
	// a best guess of 60 pixels.
	getWheelDelta: function (e) {
		return (L.Browser.edge) ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
		       (e.deltaY && e.deltaMode === 0) ? -e.deltaY / L.DomEvent._wheelPxFactor : // Pixels
		       (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
		       (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
		       (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
		       e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
		       (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
		       e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
		       0;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
		L.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_isExternalTarget: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || (e.originalEvent && e.originalEvent.timeStamp)),
		    elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			return;
		}
		L.DomEvent._lastClick = timeStamp;

		handler(e);
	}
};

// @function addListener(…): this
// Alias to [`L.DomEvent.on`](#domevent-on)
L.DomEvent.addListener = L.DomEvent.on;

// @function removeListener(…): this
// Alias to [`L.DomEvent.off`](#domevent-off)
L.DomEvent.removeListener = L.DomEvent.off;



/*
 * @class PosAnimation
 * @aka L.PosAnimation
 * @inherits Evented
 * Used internally for panning animations, utilizing CSS3 Transitions for modern browsers and a timer fallback for IE6-9.
 *
 * @example
 * ```js
 * var fx = new L.PosAnimation();
 * fx.run(el, [300, 500], 0.5);
 * ```
 *
 * @constructor L.PosAnimation()
 * Creates a `PosAnimation` object.
 *
 */

L.PosAnimation = L.Evented.extend({

	// @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
	// Run an animation of a given element to a new position, optionally setting
	// duration in seconds (`0.25` by default) and easing linearity factor (3rd
	// argument of the [cubic bezier curve](http://cubic-bezier.com/#0,0,.5,1),
	// `0.5` by default).
	run: function (el, newPos, duration, easeLinearity) {
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		// @event start: Event
		// Fired when the animation starts
		this.fire('start');

		this._animate();
	},

	// @method stop()
	// Stops the animation (if currently running).
	stop: function () {
		if (!this._inProgress) { return; }

		this._step(true);
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function (round) {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration), round);
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress, round) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		if (round) {
			pos._round();
		}
		L.DomUtil.setPosition(this._el, pos);

		// @event step: Event
		// Fired continuously during the animation.
		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		// @event end: Event
		// Fired when the animation ends.
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});



/*
 * @namespace Projection
 * @projection L.Projection.Mercator
 *
 * Elliptical Mercator projection — more complex than Spherical Mercator. Takes into account that Earth is a geoid, not a perfect sphere. Used by the EPSG:3395 CRS.
 */

L.Projection.Mercator = {
	R: 6378137,
	R_MINOR: 6356752.314245179,

	bounds: L.bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),

	project: function (latlng) {
		var d = Math.PI / 180,
		    r = this.R,
		    y = latlng.lat * d,
		    tmp = this.R_MINOR / r,
		    e = Math.sqrt(1 - tmp * tmp),
		    con = e * Math.sin(y);

		var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
		y = -r * Math.log(Math.max(ts, 1E-10));

		return new L.Point(latlng.lng * d * r, y);
	},

	unproject: function (point) {
		var d = 180 / Math.PI,
		    r = this.R,
		    tmp = this.R_MINOR / r,
		    e = Math.sqrt(1 - tmp * tmp),
		    ts = Math.exp(-point.y / r),
		    phi = Math.PI / 2 - 2 * Math.atan(ts);

		for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
			con = e * Math.sin(phi);
			con = Math.pow((1 - con) / (1 + con), e / 2);
			dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
			phi += dphi;
		}

		return new L.LatLng(phi * d, point.x * d / r);
	}
};



/*
 * @namespace CRS
 * @crs L.CRS.EPSG3395
 *
 * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
 */

L.CRS.EPSG3395 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:3395',
	projection: L.Projection.Mercator,

	transformation: (function () {
		var scale = 0.5 / (Math.PI * L.Projection.Mercator.R);
		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});



/*
 * @class GridLayer
 * @inherits Layer
 * @aka L.GridLayer
 *
 * Generic class for handling a tiled grid of HTML elements. This is the base class for all tile layers and replaces `TileLayer.Canvas`.
 * GridLayer can be extended to create a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will handle creating and animating these DOM elements for you.
 *
 *
 * @section Synchronous usage
 * @example
 *
 * To create a custom layer, extend GridLayer and implement the `createTile()` method, which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level) coordinates to draw your tile.
 *
 * ```js
 * var CanvasLayer = L.GridLayer.extend({
 *     createTile: function(coords){
 *         // create a <canvas> element for drawing
 *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
 *
 *         // setup tile width and height according to the options
 *         var size = this.getTileSize();
 *         tile.width = size.x;
 *         tile.height = size.y;
 *
 *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
 *         var ctx = tile.getContext('2d');
 *
 *         // return the tile so it can be rendered on screen
 *         return tile;
 *     }
 * });
 * ```
 *
 * @section Asynchronous usage
 * @example
 *
 * Tile creation can also be asynchronous, this is useful when using a third-party drawing library. Once the tile is finished drawing it can be passed to the `done()` callback.
 *
 * ```js
 * var CanvasLayer = L.GridLayer.extend({
 *     createTile: function(coords, done){
 *         var error;
 *
 *         // create a <canvas> element for drawing
 *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
 *
 *         // setup tile width and height according to the options
 *         var size = this.getTileSize();
 *         tile.width = size.x;
 *         tile.height = size.y;
 *
 *         // draw something asynchronously and pass the tile to the done() callback
 *         setTimeout(function() {
 *             done(error, tile);
 *         }, 1000);
 *
 *         return tile;
 *     }
 * });
 * ```
 *
 * @section
 */


L.GridLayer = L.Layer.extend({

	// @section
	// @aka GridLayer options
	options: {
		// @option tileSize: Number|Point = 256
		// Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
		tileSize: 256,

		// @option opacity: Number = 1.0
		// Opacity of the tiles. Can be used in the `createTile()` function.
		opacity: 1,

		// @option updateWhenIdle: Boolean = depends
		// If `false`, new tiles are loaded during panning, otherwise only after it (for better performance). `true` by default on mobile browsers, otherwise `false`.
		updateWhenIdle: L.Browser.mobile,

		// @option updateWhenZooming: Boolean = true
		// By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
		updateWhenZooming: true,

		// @option updateInterval: Number = 200
		// Tiles will not update more than once every `updateInterval` milliseconds when panning.
		updateInterval: 200,

		// @option attribution: String = null
		// String to be shown in the attribution control, describes the layer data, e.g. "© Mapbox".
		attribution: null,

		// @option zIndex: Number = 1
		// The explicit zIndex of the tile layer.
		zIndex: 1,

		// @option bounds: LatLngBounds = undefined
		// If set, tiles will only be loaded inside the set `LatLngBounds`.
		bounds: null,

		// @option minZoom: Number = 0
		// The minimum zoom level that tiles will be loaded at. By default the entire map.
		minZoom: 0,

		// @option maxZoom: Number = undefined
		// The maximum zoom level that tiles will be loaded at.
		maxZoom: undefined,

		// @option noWrap: Boolean = false
		// Whether the layer is wrapped around the antimeridian. If `true`, the
		// GridLayer will only be displayed once at low zoom levels. Has no
		// effect when the [map CRS](#map-crs) doesn't wrap around.
		noWrap: false,

		// @option pane: String = 'tilePane'
		// `Map pane` where the grid layer will be added.
		pane: 'tilePane',

		// @option className: String = ''
		// A custom class name to assign to the tile layer. Empty by default.
		className: '',

		// @option keepBuffer: Number = 2
		// When panning the map, keep this many rows and columns of tiles before unloading them.
		keepBuffer: 2
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function () {
		this._initContainer();

		this._levels = {};
		this._tiles = {};

		this._resetView();
		this._update();
	},

	beforeAdd: function (map) {
		map._addZoomLimit(this);
	},

	onRemove: function (map) {
		this._removeAllTiles();
		L.DomUtil.remove(this._container);
		map._removeZoomLimit(this);
		this._container = null;
		this._tileZoom = null;
	},

	// @method bringToFront: this
	// Brings the tile layer to the top of all tile layers.
	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._container);
			this._setAutoZIndex(Math.max);
		}
		return this;
	},

	// @method bringToBack: this
	// Brings the tile layer to the bottom of all tile layers.
	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._container);
			this._setAutoZIndex(Math.min);
		}
		return this;
	},

	// @method getAttribution: String
	// Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
	getAttribution: function () {
		return this.options.attribution;
	},

	// @method getContainer: HTMLElement
	// Returns the HTML element that contains the tiles for this layer.
	getContainer: function () {
		return this._container;
	},

	// @method setOpacity(opacity: Number): this
	// Changes the [opacity](#gridlayer-opacity) of the grid layer.
	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	// @method setZIndex(zIndex: Number): this
	// Changes the [zIndex](#gridlayer-zindex) of the grid layer.
	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	// @method isLoading: Boolean
	// Returns `true` if any tile in the grid layer has not finished loading.
	isLoading: function () {
		return this._loading;
	},

	// @method redraw: this
	// Causes the layer to clear all the tiles and request them again.
	redraw: function () {
		if (this._map) {
			this._removeAllTiles();
			this._update();
		}
		return this;
	},

	getEvents: function () {
		var events = {
			viewprereset: this._invalidateAll,
			viewreset: this._resetView,
			zoom: this._resetView,
			moveend: this._onMoveEnd
		};

		if (!this.options.updateWhenIdle) {
			// update tiles on move, but not more often than once per given interval
			if (!this._onMove) {
				this._onMove = L.Util.throttle(this._onMoveEnd, this.options.updateInterval, this);
			}

			events.move = this._onMove;
		}

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	// @section Extension methods
	// Layers extending `GridLayer` shall reimplement the following method.
	// @method createTile(coords: Object, done?: Function): HTMLElement
	// Called only internally, must be overriden by classes extending `GridLayer`.
	// Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
	// is specified, it must be called when the tile has finished loading and drawing.
	createTile: function () {
		return document.createElement('div');
	},

	// @section
	// @method getTileSize: Point
	// Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
	getTileSize: function () {
		var s = this.options.tileSize;
		return s instanceof L.Point ? s : new L.Point(s, s);
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (compare) {
		// go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)

		var layers = this.getPane().children,
		    edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

		for (var i = 0, len = layers.length, zIndex; i < len; i++) {

			zIndex = layers[i].style.zIndex;

			if (layers[i] !== this._container && zIndex) {
				edgeZIndex = compare(edgeZIndex, +zIndex);
			}
		}

		if (isFinite(edgeZIndex)) {
			this.options.zIndex = edgeZIndex + compare(-1, 1);
			this._updateZIndex();
		}
	},

	_updateOpacity: function () {
		if (!this._map) { return; }

		// IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
		if (L.Browser.ielt9) { return; }

		L.DomUtil.setOpacity(this._container, this.options.opacity);

		var now = +new Date(),
		    nextFrame = false,
		    willPrune = false;

		for (var key in this._tiles) {
			var tile = this._tiles[key];
			if (!tile.current || !tile.loaded) { continue; }

			var fade = Math.min(1, (now - tile.loaded) / 200);

			L.DomUtil.setOpacity(tile.el, fade);
			if (fade < 1) {
				nextFrame = true;
			} else {
				if (tile.active) { willPrune = true; }
				tile.active = true;
			}
		}

		if (willPrune && !this._noPrune) { this._pruneTiles(); }

		if (nextFrame) {
			L.Util.cancelAnimFrame(this._fadeFrame);
			this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
		}
	},

	_initContainer: function () {
		if (this._container) { return; }

		this._container = L.DomUtil.create('div', 'leaflet-layer ' + (this.options.className || ''));
		this._updateZIndex();

		if (this.options.opacity < 1) {
			this._updateOpacity();
		}

		this.getPane().appendChild(this._container);
	},

	_updateLevels: function () {

		var zoom = this._tileZoom,
		    maxZoom = this.options.maxZoom;

		if (zoom === undefined) { return undefined; }

		for (var z in this._levels) {
			if (this._levels[z].el.children.length || z === zoom) {
				this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
			} else {
				L.DomUtil.remove(this._levels[z].el);
				this._removeTilesAtZoom(z);
				delete this._levels[z];
			}
		}

		var level = this._levels[zoom],
		    map = this._map;

		if (!level) {
			level = this._levels[zoom] = {};

			level.el = L.DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
			level.el.style.zIndex = maxZoom;

			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
			level.zoom = zoom;

			this._setZoomTransform(level, map.getCenter(), map.getZoom());

			// force the browser to consider the newly added element for transition
			L.Util.falseFn(level.el.offsetWidth);
		}

		this._level = level;

		return level;
	},

	_pruneTiles: function () {
		if (!this._map) {
			return;
		}

		var key, tile;

		var zoom = this._map.getZoom();
		if (zoom > this.options.maxZoom ||
			zoom < this.options.minZoom) {
			this._removeAllTiles();
			return;
		}

		for (key in this._tiles) {
			tile = this._tiles[key];
			tile.retain = tile.current;
		}

		for (key in this._tiles) {
			tile = this._tiles[key];
			if (tile.current && !tile.active) {
				var coords = tile.coords;
				if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
					this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
				}
			}
		}

		for (key in this._tiles) {
			if (!this._tiles[key].retain) {
				this._removeTile(key);
			}
		}
	},

	_removeTilesAtZoom: function (zoom) {
		for (var key in this._tiles) {
			if (this._tiles[key].coords.z !== zoom) {
				continue;
			}
			this._removeTile(key);
		}
	},

	_removeAllTiles: function () {
		for (var key in this._tiles) {
			this._removeTile(key);
		}
	},

	_invalidateAll: function () {
		for (var z in this._levels) {
			L.DomUtil.remove(this._levels[z].el);
			delete this._levels[z];
		}
		this._removeAllTiles();

		this._tileZoom = null;
	},

	_retainParent: function (x, y, z, minZoom) {
		var x2 = Math.floor(x / 2),
		    y2 = Math.floor(y / 2),
		    z2 = z - 1,
		    coords2 = new L.Point(+x2, +y2);
		coords2.z = +z2;

		var key = this._tileCoordsToKey(coords2),
		    tile = this._tiles[key];

		if (tile && tile.active) {
			tile.retain = true;
			return true;

		} else if (tile && tile.loaded) {
			tile.retain = true;
		}

		if (z2 > minZoom) {
			return this._retainParent(x2, y2, z2, minZoom);
		}

		return false;
	},

	_retainChildren: function (x, y, z, maxZoom) {

		for (var i = 2 * x; i < 2 * x + 2; i++) {
			for (var j = 2 * y; j < 2 * y + 2; j++) {

				var coords = new L.Point(i, j);
				coords.z = z + 1;

				var key = this._tileCoordsToKey(coords),
				    tile = this._tiles[key];

				if (tile && tile.active) {
					tile.retain = true;
					continue;

				} else if (tile && tile.loaded) {
					tile.retain = true;
				}

				if (z + 1 < maxZoom) {
					this._retainChildren(i, j, z + 1, maxZoom);
				}
			}
		}
	},

	_resetView: function (e) {
		var animating = e && (e.pinch || e.flyTo);
		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
	},

	_animateZoom: function (e) {
		this._setView(e.center, e.zoom, true, e.noUpdate);
	},

	_setView: function (center, zoom, noPrune, noUpdate) {
		var tileZoom = Math.round(zoom);
		if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
		    (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
			tileZoom = undefined;
		}

		var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);

		if (!noUpdate || tileZoomChanged) {

			this._tileZoom = tileZoom;

			if (this._abortLoading) {
				this._abortLoading();
			}

			this._updateLevels();
			this._resetGrid();

			if (tileZoom !== undefined) {
				this._update(center);
			}

			if (!noPrune) {
				this._pruneTiles();
			}

			// Flag to prevent _updateOpacity from pruning tiles during
			// a zoom anim or a pinch gesture
			this._noPrune = !!noPrune;
		}

		this._setZoomTransforms(center, zoom);
	},

	_setZoomTransforms: function (center, zoom) {
		for (var i in this._levels) {
			this._setZoomTransform(this._levels[i], center, zoom);
		}
	},

	_setZoomTransform: function (level, center, zoom) {
		var scale = this._map.getZoomScale(zoom, level.zoom),
		    translate = level.origin.multiplyBy(scale)
		        .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(level.el, translate, scale);
		} else {
			L.DomUtil.setPosition(level.el, translate);
		}
	},

	_resetGrid: function () {
		var map = this._map,
		    crs = map.options.crs,
		    tileSize = this._tileSize = this.getTileSize(),
		    tileZoom = this._tileZoom;

		var bounds = this._map.getPixelWorldBounds(this._tileZoom);
		if (bounds) {
			this._globalTileRange = this._pxBoundsToTileRange(bounds);
		}

		this._wrapX = crs.wrapLng && !this.options.noWrap && [
			Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
			Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
		];
		this._wrapY = crs.wrapLat && !this.options.noWrap && [
			Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
			Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
		];
	},

	_onMoveEnd: function () {
		if (!this._map || this._map._animatingZoom) { return; }

		this._update();
	},

	_getTiledPixelBounds: function (center) {
		var map = this._map,
		    mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
		    scale = map.getZoomScale(mapZoom, this._tileZoom),
		    pixelCenter = map.project(center, this._tileZoom).floor(),
		    halfSize = map.getSize().divideBy(scale * 2);

		return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
	},

	// Private method to load tiles in the grid's active zoom level according to map bounds
	_update: function (center) {
		var map = this._map;
		if (!map) { return; }
		var zoom = map.getZoom();

		if (center === undefined) { center = map.getCenter(); }
		if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

		var pixelBounds = this._getTiledPixelBounds(center),
		    tileRange = this._pxBoundsToTileRange(pixelBounds),
		    tileCenter = tileRange.getCenter(),
		    queue = [],
		    margin = this.options.keepBuffer,
		    noPruneRange = new L.Bounds(tileRange.getBottomLeft().subtract([margin, -margin]),
		                              tileRange.getTopRight().add([margin, -margin]));

		for (var key in this._tiles) {
			var c = this._tiles[key].coords;
			if (c.z !== this._tileZoom || !noPruneRange.contains(L.point(c.x, c.y))) {
				this._tiles[key].current = false;
			}
		}

		// _update just loads more tiles. If the tile zoom level differs too much
		// from the map's, let _setView reset levels and prune old tiles.
		if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

		// create a queue of coordinates to load tiles from
		for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
			for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
				var coords = new L.Point(i, j);
				coords.z = this._tileZoom;

				if (!this._isValidTile(coords)) { continue; }

				var tile = this._tiles[this._tileCoordsToKey(coords)];
				if (tile) {
					tile.current = true;
				} else {
					queue.push(coords);
				}
			}
		}

		// sort tile queue to load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
		});

		if (queue.length !== 0) {
			// if it's the first batch of tiles to load
			if (!this._loading) {
				this._loading = true;
				// @event loading: Event
				// Fired when the grid layer starts loading tiles.
				this.fire('loading');
			}

			// create DOM fragment to append tiles in one batch
			var fragment = document.createDocumentFragment();

			for (i = 0; i < queue.length; i++) {
				this._addTile(queue[i], fragment);
			}

			this._level.el.appendChild(fragment);
		}
	},

	_isValidTile: function (coords) {
		var crs = this._map.options.crs;

		if (!crs.infinite) {
			// don't load tile if it's out of bounds and not wrapped
			var bounds = this._globalTileRange;
			if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
			    (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
		}

		if (!this.options.bounds) { return true; }

		// don't load tile if it doesn't intersect the bounds in options
		var tileBounds = this._tileCoordsToBounds(coords);
		return L.latLngBounds(this.options.bounds).overlaps(tileBounds);
	},

	_keyToBounds: function (key) {
		return this._tileCoordsToBounds(this._keyToTileCoords(key));
	},

	// converts tile coordinates to its geographical bounds
	_tileCoordsToBounds: function (coords) {

		var map = this._map,
		    tileSize = this.getTileSize(),

		    nwPoint = coords.scaleBy(tileSize),
		    sePoint = nwPoint.add(tileSize),

		    nw = map.unproject(nwPoint, coords.z),
		    se = map.unproject(sePoint, coords.z);

		if (!this.options.noWrap) {
			nw = map.wrapLatLng(nw);
			se = map.wrapLatLng(se);
		}

		return new L.LatLngBounds(nw, se);
	},

	// converts tile coordinates to key for the tile cache
	_tileCoordsToKey: function (coords) {
		return coords.x + ':' + coords.y + ':' + coords.z;
	},

	// converts tile cache key to coordinates
	_keyToTileCoords: function (key) {
		var k = key.split(':'),
		    coords = new L.Point(+k[0], +k[1]);
		coords.z = +k[2];
		return coords;
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];
		if (!tile) { return; }

		L.DomUtil.remove(tile.el);

		delete this._tiles[key];

		// @event tileunload: TileEvent
		// Fired when a tile is removed (e.g. when a tile goes off the screen).
		this.fire('tileunload', {
			tile: tile.el,
			coords: this._keyToTileCoords(key)
		});
	},

	_initTile: function (tile) {
		L.DomUtil.addClass(tile, 'leaflet-tile');

		var tileSize = this.getTileSize();
		tile.style.width = tileSize.x + 'px';
		tile.style.height = tileSize.y + 'px';

		tile.onselectstart = L.Util.falseFn;
		tile.onmousemove = L.Util.falseFn;

		// update opacity on tiles in IE7-8 because of filter inheritance problems
		if (L.Browser.ielt9 && this.options.opacity < 1) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}

		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.android && !L.Browser.android23) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
	},

	_addTile: function (coords, container) {
		var tilePos = this._getTilePos(coords),
		    key = this._tileCoordsToKey(coords);

		var tile = this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));

		this._initTile(tile);

		// if createTile is defined with a second argument ("done" callback),
		// we know that tile is async and will be ready later; otherwise
		if (this.createTile.length < 2) {
			// mark tile as ready, but delay one frame for opacity animation to happen
			L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords, null, tile));
		}

		L.DomUtil.setPosition(tile, tilePos);

		// save tile in cache
		this._tiles[key] = {
			el: tile,
			coords: coords,
			current: true
		};

		container.appendChild(tile);
		// @event tileloadstart: TileEvent
		// Fired when a tile is requested and starts loading.
		this.fire('tileloadstart', {
			tile: tile,
			coords: coords
		});
	},

	_tileReady: function (coords, err, tile) {
		if (!this._map) { return; }

		if (err) {
			// @event tileerror: TileErrorEvent
			// Fired when there is an error loading a tile.
			this.fire('tileerror', {
				error: err,
				tile: tile,
				coords: coords
			});
		}

		var key = this._tileCoordsToKey(coords);

		tile = this._tiles[key];
		if (!tile) { return; }

		tile.loaded = +new Date();
		if (this._map._fadeAnimated) {
			L.DomUtil.setOpacity(tile.el, 0);
			L.Util.cancelAnimFrame(this._fadeFrame);
			this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
		} else {
			tile.active = true;
			this._pruneTiles();
		}

		if (!err) {
			L.DomUtil.addClass(tile.el, 'leaflet-tile-loaded');

			// @event tileload: TileEvent
			// Fired when a tile loads.
			this.fire('tileload', {
				tile: tile.el,
				coords: coords
			});
		}

		if (this._noTilesToLoad()) {
			this._loading = false;
			// @event load: Event
			// Fired when the grid layer loaded all visible tiles.
			this.fire('load');

			if (L.Browser.ielt9 || !this._map._fadeAnimated) {
				L.Util.requestAnimFrame(this._pruneTiles, this);
			} else {
				// Wait a bit more than 0.2 secs (the duration of the tile fade-in)
				// to trigger a pruning.
				setTimeout(L.bind(this._pruneTiles, this), 250);
			}
		}
	},

	_getTilePos: function (coords) {
		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
	},

	_wrapCoords: function (coords) {
		var newCoords = new L.Point(
			this._wrapX ? L.Util.wrapNum(coords.x, this._wrapX) : coords.x,
			this._wrapY ? L.Util.wrapNum(coords.y, this._wrapY) : coords.y);
		newCoords.z = coords.z;
		return newCoords;
	},

	_pxBoundsToTileRange: function (bounds) {
		var tileSize = this.getTileSize();
		return new L.Bounds(
			bounds.min.unscaleBy(tileSize).floor(),
			bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
	},

	_noTilesToLoad: function () {
		for (var key in this._tiles) {
			if (!this._tiles[key].loaded) { return false; }
		}
		return true;
	}
});

// @factory L.gridLayer(options?: GridLayer options)
// Creates a new instance of GridLayer with the supplied options.
L.gridLayer = function (options) {
	return new L.GridLayer(options);
};



/*
 * @class TileLayer
 * @inherits GridLayer
 * @aka L.TileLayer
 * Used to load and display tile layers on the map. Extends `GridLayer`.
 *
 * @example
 *
 * ```js
 * L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar'}).addTo(map);
 * ```
 *
 * @section URL template
 * @example
 *
 * A string of the following form:
 *
 * ```
 * 'http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
 * ```
 *
 * `{s}` means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` — tile coordinates. `{r}` can be used to add @2x to the URL to load retina tiles.
 *
 * You can use custom keys in the template, which will be [evaluated](#util-template) from TileLayer options, like this:
 *
 * ```
 * L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
 * ```
 */


L.TileLayer = L.GridLayer.extend({

	// @section
	// @aka TileLayer options
	options: {
		// @option minZoom: Number = 0
		// Minimum zoom number.
		minZoom: 0,

		// @option maxZoom: Number = 18
		// Maximum zoom number.
		maxZoom: 18,

		// @option maxNativeZoom: Number = null
		// Maximum zoom number the tile source has available. If it is specified,
		// the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
		// from `maxNativeZoom` level and auto-scaled.
		maxNativeZoom: null,

		// @option subdomains: String|String[] = 'abc'
		// Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
		subdomains: 'abc',

		// @option errorTileUrl: String = ''
		// URL to the tile image to show in place of the tile that failed to load.
		errorTileUrl: '',

		// @option zoomOffset: Number = 0
		// The zoom number used in tile URLs will be offset with this value.
		zoomOffset: 0,

		// @option tms: Boolean = false
		// If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
		tms: false,

		// @option zoomReverse: Boolean = false
		// If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
		zoomReverse: false,

		// @option detectRetina: Boolean = false
		// If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
		detectRetina: false,

		// @option crossOrigin: Boolean = false
		// If true, all tiles will have their crossOrigin attribute set to ''. This is needed if you want to access tile pixel data.
		crossOrigin: false
	},

	initialize: function (url, options) {

		this._url = url;

		options = L.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);

			if (!options.zoomReverse) {
				options.zoomOffset++;
				options.maxZoom--;
			} else {
				options.zoomOffset--;
				options.minZoom++;
			}

			options.minZoom = Math.max(0, options.minZoom);
		}

		if (typeof options.subdomains === 'string') {
			options.subdomains = options.subdomains.split('');
		}

		// for https://github.com/Leaflet/Leaflet/issues/137
		if (!L.Browser.android) {
			this.on('tileunload', this._onTileRemove);
		}
	},

	// @method setUrl(url: String, noRedraw?: Boolean): this
	// Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}
		return this;
	},

	// @method createTile(coords: Object, done?: Function): HTMLElement
	// Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
	// to return an `<img>` HTML element with the appropiate image URL given `coords`. The `done`
	// callback is called when the tile has been loaded.
	createTile: function (coords, done) {
		var tile = document.createElement('img');

		L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
		L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

		if (this.options.crossOrigin) {
			tile.crossOrigin = '';
		}

		/*
		 Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
		 http://www.w3.org/TR/WCAG20-TECHS/H67
		*/
		tile.alt = '';

		tile.src = this.getTileUrl(coords);

		return tile;
	},

	// @section Extension methods
	// @uninheritable
	// Layers extending `TileLayer` might reimplement the following method.
	// @method getTileUrl(coords: Object): String
	// Called only internally, returns the URL for a tile given its coordinates.
	// Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
	getTileUrl: function (coords) {
		var data = {
			r: L.Browser.retina ? '@2x' : '',
			s: this._getSubdomain(coords),
			x: coords.x,
			y: coords.y,
			z: this._getZoomForUrl()
		};
		if (this._map && !this._map.options.crs.infinite) {
			var invertedY = this._globalTileRange.max.y - coords.y;
			if (this.options.tms) {
				data['y'] = invertedY;
			}
			data['-y'] = invertedY;
		}

		return L.Util.template(this._url, L.extend(data, this.options));
	},

	_tileOnLoad: function (done, tile) {
		// For https://github.com/Leaflet/Leaflet/issues/3332
		if (L.Browser.ielt9) {
			setTimeout(L.bind(done, this, null, tile), 0);
		} else {
			done(null, tile);
		}
	},

	_tileOnError: function (done, tile, e) {
		var errorUrl = this.options.errorTileUrl;
		if (errorUrl) {
			tile.src = errorUrl;
		}
		done(e, tile);
	},

	getTileSize: function () {
		var map = this._map,
		    tileSize = L.GridLayer.prototype.getTileSize.call(this),
		    zoom = this._tileZoom + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom;

		// increase tile size when overscaling
		return zoomN !== null && zoom > zoomN ?
				tileSize.divideBy(map.getZoomScale(zoomN, zoom)).round() :
				tileSize;
	},

	_onTileRemove: function (e) {
		e.tile.onload = null;
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._tileZoom;

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom !== null ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	// stops loading all tiles in the background layer
	_abortLoading: function () {
		var i, tile;
		for (i in this._tiles) {
			if (this._tiles[i].coords.z !== this._tileZoom) {
				tile = this._tiles[i].el;

				tile.onload = L.Util.falseFn;
				tile.onerror = L.Util.falseFn;

				if (!tile.complete) {
					tile.src = L.Util.emptyImageUrl;
					L.DomUtil.remove(tile);
				}
			}
		}
	}
});


// @factory L.tilelayer(urlTemplate: String, options?: TileLayer options)
// Instantiates a tile layer object given a `URL template` and optionally an options object.

L.tileLayer = function (url, options) {
	return new L.TileLayer(url, options);
};



/*
 * @class TileLayer.WMS
 * @inherits TileLayer
 * @aka L.TileLayer.WMS
 * Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile layers on the map. Extends `TileLayer`.
 *
 * @example
 *
 * ```js
 * var nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
 * 	layers: 'nexrad-n0r-900913',
 * 	format: 'image/png',
 * 	transparent: true,
 * 	attribution: "Weather data © 2012 IEM Nexrad"
 * });
 * ```
 */

L.TileLayer.WMS = L.TileLayer.extend({

	// @section
	// @aka TileLayer.WMS options
	// If any custom options not documented here are used, they will be sent to the
	// WMS server as extra parameters in each request URL. This can be useful for
	// [non-standard vendor WMS parameters](http://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',

		// @option layers: String = ''
		// **(required)** Comma-separated list of WMS layers to show.
		layers: '',

		// @option styles: String = ''
		// Comma-separated list of WMS styles.
		styles: '',

		// @option format: String = 'image/jpeg'
		// WMS image format (use `'image/png'` for layers with transparency).
		format: 'image/jpeg',

		// @option transparent: Boolean = false
		// If `true`, the WMS service will return images with transparency.
		transparent: false,

		// @option version: String = '1.1.1'
		// Version of the WMS service to use
		version: '1.1.1'
	},

	options: {
		// @option crs: CRS = null
		// Coordinate Reference System to use for the WMS requests, defaults to
		// map CRS. Don't change this if you're not sure what it means.
		crs: null,

		// @option uppercase: Boolean = false
		// If `true`, WMS request parameter keys will be uppercase.
		uppercase: false
	},

	initialize: function (url, options) {

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams);

		// all keys that are not TileLayer options go to WMS params
		for (var i in options) {
			if (!(i in this.options)) {
				wmsParams[i] = options[i];
			}
		}

		options = L.setOptions(this, options);

		wmsParams.width = wmsParams.height = options.tileSize * (options.detectRetina && L.Browser.retina ? 2 : 1);

		this.wmsParams = wmsParams;
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;
		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (coords) {

		var tileBounds = this._tileCoordsToBounds(coords),
		    nw = this._crs.project(tileBounds.getNorthWest()),
		    se = this._crs.project(tileBounds.getSouthEast()),

		    bbox = (this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
			    [se.y, nw.x, nw.y, se.x] :
			    [nw.x, se.y, se.x, nw.y]).join(','),

		    url = L.TileLayer.prototype.getTileUrl.call(this, coords);

		return url +
			L.Util.getParamString(this.wmsParams, url, this.options.uppercase) +
			(this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
	},

	// @method setParams(params: Object, noRedraw?: Boolean): this
	// Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
	setParams: function (params, noRedraw) {

		L.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});


// @factory L.tileLayer.wms(baseUrl: String, options: TileLayer.WMS options)
// Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS parameters/options object.
L.tileLayer.wms = function (url, options) {
	return new L.TileLayer.WMS(url, options);
};



/*
 * @class ImageOverlay
 * @aka L.ImageOverlay
 * @inherits Interactive layer
 *
 * Used to load and display a single image over specific bounds of the map. Extends `Layer`.
 *
 * @example
 *
 * ```js
 * var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
 * 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
 * L.imageOverlay(imageUrl, imageBounds).addTo(map);
 * ```
 */

L.ImageOverlay = L.Layer.extend({

	// @section
	// @aka ImageOverlay options
	options: {
		// @option opacity: Number = 1.0
		// The opacity of the image overlay.
		opacity: 1,

		// @option alt: String = ''
		// Text for the `alt` attribute of the image (useful for accessibility).
		alt: '',

		// @option interactive: Boolean = false
		// If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
		interactive: false,

		// @option attribution: String = null
		// An optional string containing HTML to be shown on the `Attribution control`
		attribution: null,

		// @option crossOrigin: Boolean = false
		// If true, the image will have its crossOrigin attribute set to ''. This is needed if you want to access image pixel data.
		crossOrigin: false
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	onAdd: function () {
		if (!this._image) {
			this._initImage();

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}

		if (this.options.interactive) {
			L.DomUtil.addClass(this._image, 'leaflet-interactive');
			this.addInteractiveTarget(this._image);
		}

		this.getPane().appendChild(this._image);
		this._reset();
	},

	onRemove: function () {
		L.DomUtil.remove(this._image);
		if (this.options.interactive) {
			this.removeInteractiveTarget(this._image);
		}
	},

	// @method setOpacity(opacity: Number): this
	// Sets the opacity of the overlay.
	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._image) {
			this._updateOpacity();
		}
		return this;
	},

	setStyle: function (styleOpts) {
		if (styleOpts.opacity) {
			this.setOpacity(styleOpts.opacity);
		}
		return this;
	},

	// @method bringToFront(): this
	// Brings the layer to the top of all overlays.
	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._image);
		}
		return this;
	},

	// @method bringToBack(): this
	// Brings the layer to the bottom of all overlays.
	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._image);
		}
		return this;
	},

	// @method setUrl(url: String): this
	// Changes the URL of the image.
	setUrl: function (url) {
		this._url = url;

		if (this._image) {
			this._image.src = url;
		}
		return this;
	},

	setBounds: function (bounds) {
		this._bounds = bounds;

		if (this._map) {
			this._reset();
		}
		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getEvents: function () {
		var events = {
			zoom: this._reset,
			viewreset: this._reset
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	getBounds: function () {
		return this._bounds;
	},

	getElement: function () {
		return this._image;
	},

	_initImage: function () {
		var img = this._image = L.DomUtil.create('img',
				'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));

		img.onselectstart = L.Util.falseFn;
		img.onmousemove = L.Util.falseFn;

		img.onload = L.bind(this.fire, this, 'load');

		if (this.options.crossOrigin) {
			img.crossOrigin = '';
		}

		img.src = this._url;
		img.alt = this.options.alt;
	},

	_animateZoom: function (e) {
		var scale = this._map.getZoomScale(e.zoom),
		    offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;

		L.DomUtil.setTransform(this._image, offset, scale);
	},

	_reset: function () {
		var image = this._image,
		    bounds = new L.Bounds(
		        this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		        this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
		    size = bounds.getSize();

		L.DomUtil.setPosition(image, bounds.min);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

// @factory L.imageOverlay(imageUrl: String, bounds: LatLngBounds, options?: ImageOverlay options)
// Instantiates an image overlay object given the URL of the image and the
// geographical bounds it is tied to.
L.imageOverlay = function (url, bounds, options) {
	return new L.ImageOverlay(url, bounds, options);
};



/*
 * @class Icon
 * @aka L.Icon
 * @inherits Layer
 *
 * Represents an icon to provide when creating a marker.
 *
 * @example
 *
 * ```js
 * var myIcon = L.icon({
 *     iconUrl: 'my-icon.png',
 *     iconRetinaUrl: 'my-icon@2x.png',
 *     iconSize: [38, 95],
 *     iconAnchor: [22, 94],
 *     popupAnchor: [-3, -76],
 *     shadowUrl: 'my-icon-shadow.png',
 *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
 *     shadowSize: [68, 95],
 *     shadowAnchor: [22, 94]
 * });
 *
 * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
 * ```
 *
 * `L.Icon.Default` extends `L.Icon` and is the blue icon Leaflet uses for markers by default.
 *
 */

L.Icon = L.Class.extend({

	/* @section
	 * @aka Icon options
	 *
	 * @option iconUrl: String = null
	 * **(required)** The URL to the icon image (absolute or relative to your script path).
	 *
	 * @option iconRetinaUrl: String = null
	 * The URL to a retina sized version of the icon image (absolute or relative to your
	 * script path). Used for Retina screen devices.
	 *
	 * @option iconSize: Point = null
	 * Size of the icon image in pixels.
	 *
	 * @option iconAnchor: Point = null
	 * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
	 * will be aligned so that this point is at the marker's geographical location. Centered
	 * by default if size is specified, also can be set in CSS with negative margins.
	 *
	 * @option popupAnchor: Point = null
	 * The coordinates of the point from which popups will "open", relative to the icon anchor.
	 *
	 * @option shadowUrl: String = null
	 * The URL to the icon shadow image. If not specified, no shadow image will be created.
	 *
	 * @option shadowRetinaUrl: String = null
	 *
	 * @option shadowSize: Point = null
	 * Size of the shadow image in pixels.
	 *
	 * @option shadowAnchor: Point = null
	 * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
	 * as iconAnchor if not specified).
	 *
	 * @option className: String = ''
	 * A custom class name to assign to both icon and shadow images. Empty by default.
	 */

	initialize: function (options) {
		L.setOptions(this, options);
	},

	// @method createIcon(oldIcon?: HTMLElement): HTMLElement
	// Called internally when the icon has to be shown, returns a `<img>` HTML element
	// styled according to the options.
	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	// @method createShadow(oldIcon?: HTMLElement): HTMLElement
	// As `createIcon`, but for the shadow beneath it.
	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options;
		var sizeOption = options[name + 'Size'];

		if (typeof sizeOption === 'number') {
			sizeOption = [sizeOption, sizeOption];
		}

		var size = L.point(sizeOption),
		    anchor = L.point(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
		            size && size.divideBy(2, true));

		img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		return L.Browser.retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
	}
});


// @factory L.icon(options: Icon options)
// Creates an icon instance with the given options.
L.icon = function (options) {
	return new L.Icon(options);
};



/*
 * @miniclass Icon.Default (Icon)
 * @aka L.Icon.Default
 * @section
 *
 * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
 * no icon is specified. Points to the blue marker image distributed with Leaflet
 * releases.
 *
 * In order to change the default icon, just change the properties of `L.Icon.Default.prototype.options`
 * (which is a set of `Icon options`).
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconUrl:       'marker-icon.png',
		iconRetinaUrl: 'marker-icon-2x.png',
		shadowUrl:     'marker-shadow.png',
		iconSize:    [25, 41],
		iconAnchor:  [12, 41],
		popupAnchor: [1, -34],
		tooltipAnchor: [16, -28],
		shadowSize:  [41, 41]
	},

	_getIconUrl: function (name) {
		if (!L.Icon.Default.imagePath) {	// Deprecated, backwards-compatibility only
			L.Icon.Default.imagePath = this._detectIconPath();
		}

		// @option imagePath: String
		// `L.Icon.Default` will try to auto-detect the absolute location of the
		// blue icon images. If you are placing these images in a non-standard
		// way, set this option to point to the right absolute path.
		return (this.options.imagePath || L.Icon.Default.imagePath) + L.Icon.prototype._getIconUrl.call(this, name);
	},

	_detectIconPath: function () {
		var el = L.DomUtil.create('div',  'leaflet-default-icon-path', document.body);
		var path = L.DomUtil.getStyle(el, 'background-image') ||
		           L.DomUtil.getStyle(el, 'backgroundImage');	// IE8

		document.body.removeChild(el);

		return path.indexOf('url') === 0 ?
			path.replace(/^url\([\"\']?/, '').replace(/marker-icon\.png[\"\']?\)$/, '') : '';
	}
});



/*
 * @class Marker
 * @inherits Interactive layer
 * @aka L.Marker
 * L.Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
 *
 * @example
 *
 * ```js
 * L.marker([50.5, 30.5]).addTo(map);
 * ```
 */

L.Marker = L.Layer.extend({

	// @section
	// @aka Marker options
	options: {
		// @option icon: Icon = *
		// Icon class to use for rendering the marker. See [Icon documentation](#L.Icon) for details on how to customize the marker icon. If not specified, a new `L.Icon.Default` is used.
		icon: new L.Icon.Default(),

		// Option inherited from "Interactive layer" abstract class
		interactive: true,

		// @option draggable: Boolean = false
		// Whether the marker is draggable with mouse/touch or not.
		draggable: false,

		// @option keyboard: Boolean = true
		// Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
		keyboard: true,

		// @option title: String = ''
		// Text for the browser tooltip that appear on marker hover (no tooltip by default).
		title: '',

		// @option alt: String = ''
		// Text for the `alt` attribute of the icon image (useful for accessibility).
		alt: '',

		// @option zIndexOffset: Number = 0
		// By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
		zIndexOffset: 0,

		// @option opacity: Number = 1.0
		// The opacity of the marker.
		opacity: 1,

		// @option riseOnHover: Boolean = false
		// If `true`, the marker will get on top of others when you hover the mouse over it.
		riseOnHover: false,

		// @option riseOffset: Number = 250
		// The z-index offset used for the `riseOnHover` feature.
		riseOffset: 250,

		// @option pane: String = 'markerPane'
		// `Map pane` where the markers icon will be added.
		pane: 'markerPane',

		// FIXME: shadowPane is no longer a valid option
		nonBubblingEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu']
	},

	/* @section
	 *
	 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
	 */

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	onAdd: function (map) {
		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

		if (this._zoomAnimated) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._initIcon();
		this.update();
	},

	onRemove: function (map) {
		if (this.dragging && this.dragging.enabled()) {
			this.options.draggable = true;
			this.dragging.removeHooks();
		}

		if (this._zoomAnimated) {
			map.off('zoomanim', this._animateZoom, this);
		}

		this._removeIcon();
		this._removeShadow();
	},

	getEvents: function () {
		return {
			zoom: this.update,
			viewreset: this.update
		};
	},

	// @method getLatLng: LatLng
	// Returns the current geographical position of the marker.
	getLatLng: function () {
		return this._latlng;
	},

	// @method setLatLng(latlng: LatLng): this
	// Changes the marker position to the given point.
	setLatLng: function (latlng) {
		var oldLatLng = this._latlng;
		this._latlng = L.latLng(latlng);
		this.update();

		// @event move: Event
		// Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
	},

	// @method setZIndexOffset(offset: Number): this
	// Changes the [zIndex offset](#marker-zindexoffset) of the marker.
	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		return this.update();
	},

	// @method setIcon(icon: Icon): this
	// Changes the marker icon.
	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup, this._popup.options);
		}

		return this;
	},

	getElement: function () {
		return this._icon;
	},

	update: function () {

		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

		var icon = options.icon.createIcon(this._icon),
		    addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		if (options.riseOnHover) {
			this.on({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		var newShadow = options.icon.createShadow(this._shadow),
		    addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		if (addIcon) {
			this.getPane().appendChild(this._icon);
		}
		this._initInteraction();
		if (newShadow && addShadow) {
			this.getPane('shadowPane').appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			this.off({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		L.DomUtil.remove(this._icon);
		this.removeInteractiveTarget(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			L.DomUtil.remove(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.interactive) { return; }

		L.DomUtil.addClass(this._icon, 'leaflet-interactive');

		this.addInteractiveTarget(this._icon);

		if (L.Handler.MarkerDrag) {
			var draggable = this.options.draggable;
			if (this.dragging) {
				draggable = this.dragging.enabled();
				this.dragging.disable();
			}

			this.dragging = new L.Handler.MarkerDrag(this);

			if (draggable) {
				this.dragging.enable();
			}
		}
	},

	// @method setOpacity(opacity: Number): this
	// Changes the opacity of the marker.
	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		var opacity = this.options.opacity;

		L.DomUtil.setOpacity(this._icon, opacity);

		if (this._shadow) {
			L.DomUtil.setOpacity(this._shadow, opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	},

	_getPopupAnchor: function () {
		return this.options.icon.options.popupAnchor || [0, 0];
	},

	_getTooltipAnchor: function () {
		return this.options.icon.options.tooltipAnchor || [0, 0];
	}
});


// factory L.marker(latlng: LatLng, options? : Marker options)

// @factory L.marker(latlng: LatLng, options? : Marker options)
// Instantiates a Marker object given a geographical point and optionally an options object.
L.marker = function (latlng, options) {
	return new L.Marker(latlng, options);
};



/*
 * @class DivIcon
 * @aka L.DivIcon
 * @inherits Icon
 *
 * Represents a lightweight icon for markers that uses a simple `<div>`
 * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and shadow options.
 *
 * @example
 * ```js
 * var myIcon = L.divIcon({className: 'my-div-icon'});
 * // you can set .my-div-icon styles in CSS
 *
 * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
 * ```
 *
 * By default, it has a 'leaflet-div-icon' CSS class and is styled as a little white square with a shadow.
 */

L.DivIcon = L.Icon.extend({
	options: {
		// @section
		// @aka DivIcon options
		iconSize: [12, 12], // also can be set through CSS

		// iconAnchor: (Point),
		// popupAnchor: (Point),

		// @option html: String = ''
		// Custom HTML code to put inside the div element, empty by default.
		html: false,

		// @option bgPos: Point = [0, 0]
		// Optional relative position of the background, in pixels
		bgPos: null,

		className: 'leaflet-div-icon'
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		div.innerHTML = options.html !== false ? options.html : '';

		if (options.bgPos) {
			var bgPos = L.point(options.bgPos);
			div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
		}
		this._setIconStyles(div, 'icon');

		return div;
	},

	createShadow: function () {
		return null;
	}
});

// @factory L.divIcon(options: DivIcon options)
// Creates a `DivIcon` instance with the given options.
L.divIcon = function (options) {
	return new L.DivIcon(options);
};



/*
 * @class DivOverlay
 * @inherits Layer
 * @aka L.DivOverlay
 * Base model for L.Popup and L.Tooltip. Inherit from it for custom popup like plugins.
 */

// @namespace DivOverlay
L.DivOverlay = L.Layer.extend({

	// @section
	// @aka DivOverlay options
	options: {
		// @option offset: Point = Point(0, 7)
		// The offset of the popup position. Useful to control the anchor
		// of the popup when opening it on some overlays.
		offset: [0, 7],

		// @option className: String = ''
		// A custom CSS class name to assign to the popup.
		className: '',

		// @option pane: String = 'popupPane'
		// `Map pane` where the popup will be added.
		pane: 'popupPane'
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
	},

	onAdd: function (map) {
		this._zoomAnimated = map._zoomAnimated;

		if (!this._container) {
			this._initLayout();
		}

		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 0);
		}

		clearTimeout(this._removeTimeout);
		this.getPane().appendChild(this._container);
		this.update();

		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 1);
		}

		this.bringToFront();
	},

	onRemove: function (map) {
		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 0);
			this._removeTimeout = setTimeout(L.bind(L.DomUtil.remove, L.DomUtil, this._container), 200);
		} else {
			L.DomUtil.remove(this._container);
		}
	},

	// @namespace Popup
	// @method getLatLng: LatLng
	// Returns the geographical point of popup.
	getLatLng: function () {
		return this._latlng;
	},

	// @method setLatLng(latlng: LatLng): this
	// Sets the geographical point where the popup will open.
	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	// @method getContent: String|HTMLElement
	// Returns the content of the popup.
	getContent: function () {
		return this._content;
	},

	// @method setContent(htmlContent: String|HTMLElement|Function): this
	// Sets the HTML content of the popup. If a function is passed the source layer will be passed to the function. The function should return a `String` or `HTMLElement` to be used in the popup.
	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	// @method getElement: String|HTMLElement
	// Alias for [getContent()](#popup-getcontent)
	getElement: function () {
		return this._container;
	},

	// @method update: null
	// Updates the popup content, layout and position. Useful for updating the popup after something inside changed, e.g. image loaded.
	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	getEvents: function () {
		var events = {
			zoom: this._updatePosition,
			viewreset: this._updatePosition
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}
		return events;
	},

	// @method isOpen: Boolean
	// Returns `true` when the popup is visible on the map.
	isOpen: function () {
		return !!this._map && this._map.hasLayer(this);
	},

	// @method bringToFront: this
	// Brings this popup in front of other popups (in the same map pane).
	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._container);
		}
		return this;
	},

	// @method bringToBack: this
	// Brings this popup to the back of other popups (in the same map pane).
	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._container);
		}
		return this;
	},

	_updateContent: function () {
		if (!this._content) { return; }

		var node = this._contentNode;
		var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

		if (typeof content === 'string') {
			node.innerHTML = content;
		} else {
			while (node.hasChildNodes()) {
				node.removeChild(node.firstChild);
			}
			node.appendChild(content);
		}
		this.fire('contentupdate');
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    offset = L.point(this.options.offset),
		    anchor = this._getAnchor();

		if (this._zoomAnimated) {
			L.DomUtil.setPosition(this._container, pos.add(anchor));
		} else {
			offset = offset.add(pos).add(anchor);
		}

		var bottom = this._containerBottom = -offset.y,
		    left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = bottom + 'px';
		this._container.style.left = left + 'px';
	},

	_getAnchor: function () {
		return [0, 0];
	}

});



/*
 * @class Popup
 * @inherits DivOverlay
 * @aka L.Popup
 * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
 * open popups while making sure that only one popup is open at one time
 * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
 *
 * @example
 *
 * If you want to just bind a popup to marker click and then open it, it's really easy:
 *
 * ```js
 * marker.bindPopup(popupContent).openPopup();
 * ```
 * Path overlays like polylines also have a `bindPopup` method.
 * Here's a more complicated way to open a popup on a map:
 *
 * ```js
 * var popup = L.popup()
 * 	.setLatLng(latlng)
 * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
 * 	.openOn(map);
 * ```
 */


// @namespace Popup
L.Popup = L.DivOverlay.extend({

	// @section
	// @aka Popup options
	options: {
		// @option maxWidth: Number = 300
		// Max width of the popup, in pixels.
		maxWidth: 300,

		// @option minWidth: Number = 50
		// Min width of the popup, in pixels.
		minWidth: 50,

		// @option maxHeight: Number = null
		// If set, creates a scrollable container of the given height
		// inside a popup if its content exceeds it.
		maxHeight: null,

		// @option autoPan: Boolean = true
		// Set it to `false` if you don't want the map to do panning animation
		// to fit the opened popup.
		autoPan: true,

		// @option autoPanPaddingTopLeft: Point = null
		// The margin between the popup and the top left corner of the map
		// view after autopanning was performed.
		autoPanPaddingTopLeft: null,

		// @option autoPanPaddingBottomRight: Point = null
		// The margin between the popup and the bottom right corner of the map
		// view after autopanning was performed.
		autoPanPaddingBottomRight: null,

		// @option autoPanPadding: Point = Point(5, 5)
		// Equivalent of setting both top left and bottom right autopan padding to the same value.
		autoPanPadding: [5, 5],

		// @option keepInView: Boolean = false
		// Set it to `true` if you want to prevent users from panning the popup
		// off of the screen while it is open.
		keepInView: false,

		// @option closeButton: Boolean = true
		// Controls the presence of a close button in the popup.
		closeButton: true,

		// @option autoClose: Boolean = true
		// Set it to `false` if you want to override the default behavior of
		// the popup closing when user clicks the map (set globally by
		// the Map's [closePopupOnClick](#map-closepopuponclick) option).
		autoClose: true,

		// @option className: String = ''
		// A custom CSS class name to assign to the popup.
		className: ''
	},

	// @namespace Popup
	// @method openOn(map: Map): this
	// Adds the popup to the map and closes the previous one. The same as `map.openPopup(popup)`.
	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onAdd: function (map) {
		L.DivOverlay.prototype.onAdd.call(this, map);

		// @namespace Map
		// @section Popup events
		// @event popupopen: PopupEvent
		// Fired when a popup is opened in the map
		map.fire('popupopen', {popup: this});

		if (this._source) {
			// @namespace Layer
			// @section Popup events
			// @event popupopen: PopupEvent
			// Fired when a popup bound to this layer is opened
			this._source.fire('popupopen', {popup: this}, true);
			// For non-path layers, we toggle the popup when clicking
			// again the layer, so prevent the map to reopen it.
			if (!(this._source instanceof L.Path)) {
				this._source.on('preclick', L.DomEvent.stopPropagation);
			}
		}
	},

	onRemove: function (map) {
		L.DivOverlay.prototype.onRemove.call(this, map);

		// @namespace Map
		// @section Popup events
		// @event popupclose: PopupEvent
		// Fired when a popup in the map is closed
		map.fire('popupclose', {popup: this});

		if (this._source) {
			// @namespace Layer
			// @section Popup events
			// @event popupclose: PopupEvent
			// Fired when a popup bound to this layer is closed
			this._source.fire('popupclose', {popup: this}, true);
			if (!(this._source instanceof L.Path)) {
				this._source.off('preclick', L.DomEvent.stopPropagation);
			}
		}
	},

	getEvents: function () {
		var events = L.DivOverlay.prototype.getEvents.call(this);

		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}

		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
		    container = this._container = L.DomUtil.create('div',
			prefix + ' ' + (this.options.className || '') +
			' leaflet-zoom-animated');

		if (this.options.closeButton) {
			var closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';

			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);

		L.DomEvent
			.disableClickPropagation(wrapper)
			.disableScrollPropagation(this._contentNode)
			.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_animateZoom: function (e) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
		    anchor = this._getAnchor();
		L.DomUtil.setPosition(this._container, pos.add(anchor));
	},

	_adjustPan: function () {
		if (!this.options.autoPan || (this._map._panAnim && this._map._panAnim._inProgress)) { return; }

		var map = this._map,
		    marginBottom = parseInt(L.DomUtil.getStyle(this._container, 'marginBottom'), 10) || 0,
		    containerHeight = this._container.offsetHeight + marginBottom,
		    containerWidth = this._containerWidth,
		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

		layerPos._add(L.DomUtil.getPosition(this._container));

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = L.point(this.options.autoPanPadding),
		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		// @namespace Map
		// @section Popup events
		// @event autopanstart: Event
		// Fired when the map starts autopanning when opening a popup.
		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		L.DomEvent.stop(e);
	},

	_getAnchor: function () {
		// Where should we anchor the popup on the source layer?
		return L.point(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
	}

});

// @namespace Popup
// @factory L.popup(options?: Popup options, source?: Layer)
// Instantiates a `Popup` object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the popup with a reference to the Layer to which it refers.
L.popup = function (options, source) {
	return new L.Popup(options, source);
};


/* @namespace Map
 * @section Interaction Options
 * @option closePopupOnClick: Boolean = true
 * Set it to `false` if you don't want popups to close when user clicks the map.
 */
L.Map.mergeOptions({
	closePopupOnClick: true
});


// @namespace Map
// @section Methods for Layers and Controls
L.Map.include({
	// @method openPopup(popup: Popup): this
	// Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
	// @alternative
	// @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
	// Creates a popup with the specified content and options and opens it in the given point on a map.
	openPopup: function (popup, latlng, options) {
		if (!(popup instanceof L.Popup)) {
			popup = new L.Popup(options).setContent(popup);
		}

		if (latlng) {
			popup.setLatLng(latlng);
		}

		if (this.hasLayer(popup)) {
			return this;
		}

		if (this._popup && this._popup.options.autoClose) {
			this.closePopup();
		}

		this._popup = popup;
		return this.addLayer(popup);
	},

	// @method closePopup(popup?: Popup): this
	// Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
		}
		return this;
	}
});

/*
 * @namespace Layer
 * @section Popup methods example
 *
 * All layers share a set of methods convenient for binding popups to it.
 *
 * ```js
 * var layer = L.Polygon(latlngs).bindPopup('Hi There!').addTo(map);
 * layer.openPopup();
 * layer.closePopup();
 * ```
 *
 * Popups will also be automatically opened when the layer is clicked on and closed when the layer is removed from the map or another popup is opened.
 */

// @section Popup methods
L.Layer.include({

	// @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
	// Binds a popup to the layer with the passed `content` and sets up the
	// neccessary event listeners. If a `Function` is passed it will receive
	// the layer as the first argument and should return a `String` or `HTMLElement`.
	bindPopup: function (content, options) {

		if (content instanceof L.Popup) {
			L.setOptions(content, options);
			this._popup = content;
			content._source = this;
		} else {
			if (!this._popup || options) {
				this._popup = new L.Popup(options, this);
			}
			this._popup.setContent(content);
		}

		if (!this._popupHandlersAdded) {
			this.on({
				click: this._openPopup,
				remove: this.closePopup,
				move: this._movePopup
			});
			this._popupHandlersAdded = true;
		}

		return this;
	},

	// @method unbindPopup(): this
	// Removes the popup previously bound with `bindPopup`.
	unbindPopup: function () {
		if (this._popup) {
			this.off({
				click: this._openPopup,
				remove: this.closePopup,
				move: this._movePopup
			});
			this._popupHandlersAdded = false;
			this._popup = null;
		}
		return this;
	},

	// @method openPopup(latlng?: LatLng): this
	// Opens the bound popup at the specificed `latlng` or at the default popup anchor if no `latlng` is passed.
	openPopup: function (layer, latlng) {
		if (!(layer instanceof L.Layer)) {
			latlng = layer;
			layer = this;
		}

		if (layer instanceof L.FeatureGroup) {
			for (var id in this._layers) {
				layer = this._layers[id];
				break;
			}
		}

		if (!latlng) {
			latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
		}

		if (this._popup && this._map) {
			// set popup source to this layer
			this._popup._source = layer;

			// update the popup (content, layout, ect...)
			this._popup.update();

			// open the popup on the map
			this._map.openPopup(this._popup, latlng);
		}

		return this;
	},

	// @method closePopup(): this
	// Closes the popup bound to this layer if it is open.
	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	// @method togglePopup(): this
	// Opens or closes the popup bound to this layer depending on its current state.
	togglePopup: function (target) {
		if (this._popup) {
			if (this._popup._map) {
				this.closePopup();
			} else {
				this.openPopup(target);
			}
		}
		return this;
	},

	// @method isPopupOpen(): boolean
	// Returns `true` if the popup bound to this layer is currently open.
	isPopupOpen: function () {
		return this._popup.isOpen();
	},

	// @method setPopupContent(content: String|HTMLElement|Popup): this
	// Sets the content of the popup bound to this layer.
	setPopupContent: function (content) {
		if (this._popup) {
			this._popup.setContent(content);
		}
		return this;
	},

	// @method getPopup(): Popup
	// Returns the popup bound to this layer.
	getPopup: function () {
		return this._popup;
	},

	_openPopup: function (e) {
		var layer = e.layer || e.target;

		if (!this._popup) {
			return;
		}

		if (!this._map) {
			return;
		}

		// prevent map click
		L.DomEvent.stop(e);

		// if this inherits from Path its a vector and we can just
		// open the popup at the new location
		if (layer instanceof L.Path) {
			this.openPopup(e.layer || e.target, e.latlng);
			return;
		}

		// otherwise treat it like a marker and figure out
		// if we should toggle it open/closed
		if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
			this.closePopup();
		} else {
			this.openPopup(layer, e.latlng);
		}
	},

	_movePopup: function (e) {
		this._popup.setLatLng(e.latlng);
	}
});



/*
 * @class Tooltip
 * @inherits DivOverlay
 * @aka L.Tooltip
 * Used to display small texts on top of map layers.
 *
 * @example
 *
 * ```js
 * marker.bindTooltip("my tooltip text").openTooltip();
 * ```
 * Note about tooltip offset. Leaflet takes two options in consideration
 * for computing tooltip offseting:
 * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
 *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
 *   move it to the bottom. Negatives will move to the left and top.
 * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
 *   should adapt this value if you use a custom icon.
 */


// @namespace Tooltip
L.Tooltip = L.DivOverlay.extend({

	// @section
	// @aka Tooltip options
	options: {
		// @option pane: String = 'tooltipPane'
		// `Map pane` where the tooltip will be added.
		pane: 'tooltipPane',

		// @option offset: Point = Point(0, 0)
		// Optional offset of the tooltip position.
		offset: [0, 0],

		// @option direction: String = 'auto'
		// Direction where to open the tooltip. Possible values are: `right`, `left`,
		// `top`, `bottom`, `center`, `auto`.
		// `auto` will dynamicaly switch between `right` and `left` according to the tooltip
		// position on the map.
		direction: 'auto',

		// @option permanent: Boolean = false
		// Whether to open the tooltip permanently or only on mouseover.
		permanent: false,

		// @option sticky: Boolean = false
		// If true, the tooltip will follow the mouse instead of being fixed at the feature center.
		sticky: false,

		// @option interactive: Boolean = false
		// If true, the tooltip will listen to the feature events.
		interactive: false,

		// @option opacity: Number = 0.9
		// Tooltip container opacity.
		opacity: 0.9
	},

	onAdd: function (map) {
		L.DivOverlay.prototype.onAdd.call(this, map);
		this.setOpacity(this.options.opacity);

		// @namespace Map
		// @section Tooltip events
		// @event tooltipopen: TooltipEvent
		// Fired when a tooltip is opened in the map.
		map.fire('tooltipopen', {tooltip: this});

		if (this._source) {
			// @namespace Layer
			// @section Tooltip events
			// @event tooltipopen: TooltipEvent
			// Fired when a tooltip bound to this layer is opened.
			this._source.fire('tooltipopen', {tooltip: this}, true);
		}
	},

	onRemove: function (map) {
		L.DivOverlay.prototype.onRemove.call(this, map);

		// @namespace Map
		// @section Tooltip events
		// @event tooltipclose: TooltipEvent
		// Fired when a tooltip in the map is closed.
		map.fire('tooltipclose', {tooltip: this});

		if (this._source) {
			// @namespace Layer
			// @section Tooltip events
			// @event tooltipclose: TooltipEvent
			// Fired when a tooltip bound to this layer is closed.
			this._source.fire('tooltipclose', {tooltip: this}, true);
		}
	},

	getEvents: function () {
		var events = L.DivOverlay.prototype.getEvents.call(this);

		if (L.Browser.touch && !this.options.permanent) {
			events.preclick = this._close;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closeTooltip(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-tooltip',
		    className = prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

		this._contentNode = this._container = L.DomUtil.create('div', className);
	},

	_updateLayout: function () {},

	_adjustPan: function () {},

	_setPosition: function (pos) {
		var map = this._map,
		    container = this._container,
		    centerPoint = map.latLngToContainerPoint(map.getCenter()),
		    tooltipPoint = map.layerPointToContainerPoint(pos),
		    direction = this.options.direction,
		    tooltipWidth = container.offsetWidth,
		    tooltipHeight = container.offsetHeight,
		    offset = L.point(this.options.offset),
		    anchor = this._getAnchor();

		if (direction === 'top') {
			pos = pos.add(L.point(-tooltipWidth / 2 + offset.x, -tooltipHeight + offset.y + anchor.y));
		} else if (direction === 'bottom') {
			pos = pos.subtract(L.point(tooltipWidth / 2 - offset.x, -offset.y));
		} else if (direction === 'center') {
			pos = pos.subtract(L.point(tooltipWidth / 2 + offset.x, tooltipHeight / 2 - anchor.y + offset.y));
		} else if (direction === 'right' || direction === 'auto' && tooltipPoint.x < centerPoint.x) {
			direction = 'right';
			pos = pos.add([offset.x + anchor.x, anchor.y - tooltipHeight / 2 + offset.y]);
		} else {
			direction = 'left';
			pos = pos.subtract(L.point(tooltipWidth + anchor.x - offset.x, tooltipHeight / 2 - anchor.y - offset.y));
		}

		L.DomUtil.removeClass(container, 'leaflet-tooltip-right');
		L.DomUtil.removeClass(container, 'leaflet-tooltip-left');
		L.DomUtil.removeClass(container, 'leaflet-tooltip-top');
		L.DomUtil.removeClass(container, 'leaflet-tooltip-bottom');
		L.DomUtil.addClass(container, 'leaflet-tooltip-' + direction);
		L.DomUtil.setPosition(container, pos);
	},

	_updatePosition: function () {
		var pos = this._map.latLngToLayerPoint(this._latlng);
		this._setPosition(pos);
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	_animateZoom: function (e) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		this._setPosition(pos);
	},

	_getAnchor: function () {
		// Where should we anchor the tooltip on the source layer?
		return L.point(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
	}

});

// @namespace Tooltip
// @factory L.tooltip(options?: Tooltip options, source?: Layer)
// Instantiates a Tooltip object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the tooltip with a reference to the Layer to which it refers.
L.tooltip = function (options, source) {
	return new L.Tooltip(options, source);
};

// @namespace Map
// @section Methods for Layers and Controls
L.Map.include({

	// @method openTooltip(tooltip: Tooltip): this
	// Opens the specified tooltip.
	// @alternative
	// @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
	// Creates a tooltip with the specified content and options and open it.
	openTooltip: function (tooltip, latlng, options) {
		if (!(tooltip instanceof L.Tooltip)) {
			tooltip = new L.Tooltip(options).setContent(tooltip);
		}

		if (latlng) {
			tooltip.setLatLng(latlng);
		}

		if (this.hasLayer(tooltip)) {
			return this;
		}

		return this.addLayer(tooltip);
	},

	// @method closeTooltip(tooltip?: Tooltip): this
	// Closes the tooltip given as parameter.
	closeTooltip: function (tooltip) {
		if (tooltip) {
			this.removeLayer(tooltip);
		}
		return this;
	}

});

/*
 * @namespace Layer
 * @section Tooltip methods example
 *
 * All layers share a set of methods convenient for binding tooltips to it.
 *
 * ```js
 * var layer = L.Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
 * layer.openTooltip();
 * layer.closeTooltip();
 * ```
 */

// @section Tooltip methods
L.Layer.include({

	// @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
	// Binds a tooltip to the layer with the passed `content` and sets up the
	// neccessary event listeners. If a `Function` is passed it will receive
	// the layer as the first argument and should return a `String` or `HTMLElement`.
	bindTooltip: function (content, options) {

		if (content instanceof L.Tooltip) {
			L.setOptions(content, options);
			this._tooltip = content;
			content._source = this;
		} else {
			if (!this._tooltip || options) {
				this._tooltip = L.tooltip(options, this);
			}
			this._tooltip.setContent(content);

		}

		this._initTooltipInteractions();

		if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
			this.openTooltip();
		}

		return this;
	},

	// @method unbindTooltip(): this
	// Removes the tooltip previously bound with `bindTooltip`.
	unbindTooltip: function () {
		if (this._tooltip) {
			this._initTooltipInteractions(true);
			this.closeTooltip();
			this._tooltip = null;
		}
		return this;
	},

	_initTooltipInteractions: function (remove) {
		if (!remove && this._tooltipHandlersAdded) { return; }
		var onOff = remove ? 'off' : 'on',
		    events = {
			remove: this.closeTooltip,
			move: this._moveTooltip
		    };
		if (!this._tooltip.options.permanent) {
			events.mouseover = this._openTooltip;
			events.mouseout = this.closeTooltip;
			if (this._tooltip.options.sticky) {
				events.mousemove = this._moveTooltip;
			}
			if (L.Browser.touch) {
				events.click = this._openTooltip;
			}
		} else {
			events.add = this._openTooltip;
		}
		this[onOff](events);
		this._tooltipHandlersAdded = !remove;
	},

	// @method openTooltip(latlng?: LatLng): this
	// Opens the bound tooltip at the specificed `latlng` or at the default tooltip anchor if no `latlng` is passed.
	openTooltip: function (layer, latlng) {
		if (!(layer instanceof L.Layer)) {
			latlng = layer;
			layer = this;
		}

		if (layer instanceof L.FeatureGroup) {
			for (var id in this._layers) {
				layer = this._layers[id];
				break;
			}
		}

		if (!latlng) {
			latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
		}

		if (this._tooltip && this._map) {

			// set tooltip source to this layer
			this._tooltip._source = layer;

			// update the tooltip (content, layout, ect...)
			this._tooltip.update();

			// open the tooltip on the map
			this._map.openTooltip(this._tooltip, latlng);

			// Tooltip container may not be defined if not permanent and never
			// opened.
			if (this._tooltip.options.interactive && this._tooltip._container) {
				L.DomUtil.addClass(this._tooltip._container, 'leaflet-clickable');
				this.addInteractiveTarget(this._tooltip._container);
			}
		}

		return this;
	},

	// @method closeTooltip(): this
	// Closes the tooltip bound to this layer if it is open.
	closeTooltip: function () {
		if (this._tooltip) {
			this._tooltip._close();
			if (this._tooltip.options.interactive && this._tooltip._container) {
				L.DomUtil.removeClass(this._tooltip._container, 'leaflet-clickable');
				this.removeInteractiveTarget(this._tooltip._container);
			}
		}
		return this;
	},

	// @method toggleTooltip(): this
	// Opens or closes the tooltip bound to this layer depending on its current state.
	toggleTooltip: function (target) {
		if (this._tooltip) {
			if (this._tooltip._map) {
				this.closeTooltip();
			} else {
				this.openTooltip(target);
			}
		}
		return this;
	},

	// @method isTooltipOpen(): boolean
	// Returns `true` if the tooltip bound to this layer is currently open.
	isTooltipOpen: function () {
		return this._tooltip.isOpen();
	},

	// @method setTooltipContent(content: String|HTMLElement|Tooltip): this
	// Sets the content of the tooltip bound to this layer.
	setTooltipContent: function (content) {
		if (this._tooltip) {
			this._tooltip.setContent(content);
		}
		return this;
	},

	// @method getTooltip(): Tooltip
	// Returns the tooltip bound to this layer.
	getTooltip: function () {
		return this._tooltip;
	},

	_openTooltip: function (e) {
		var layer = e.layer || e.target;

		if (!this._tooltip || !this._map) {
			return;
		}
		this.openTooltip(layer, this._tooltip.options.sticky ? e.latlng : undefined);
	},

	_moveTooltip: function (e) {
		var latlng = e.latlng, containerPoint, layerPoint;
		if (this._tooltip.options.sticky && e.originalEvent) {
			containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
			layerPoint = this._map.containerPointToLayerPoint(containerPoint);
			latlng = this._map.layerPointToLatLng(layerPoint);
		}
		this._tooltip.setLatLng(latlng);
	}
});



/*
 * @class LayerGroup
 * @aka L.LayerGroup
 * @inherits Layer
 *
 * Used to group several layers and handle them as one. If you add it to the map,
 * any layers added or removed from the group will be added/removed on the map as
 * well. Extends `Layer`.
 *
 * @example
 *
 * ```js
 * L.layerGroup([marker1, marker2])
 * 	.addLayer(polyline)
 * 	.addTo(map);
 * ```
 */

L.LayerGroup = L.Layer.extend({

	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	// @method addLayer(layer: Layer): this
	// Adds the given layer to the group.
	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	// @method removeLayer(layer: Layer): this
	// Removes the given layer from the group.
	// @alternative
	// @method removeLayer(id: Number): this
	// Removes the layer with the given internal ID from the group.
	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	// @method hasLayer(layer: Layer): Boolean
	// Returns `true` if the given layer is currently added to the group.
	hasLayer: function (layer) {
		return !!layer && (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	// @method clearLayers(): this
	// Removes all the layers from the group.
	clearLayers: function () {
		for (var i in this._layers) {
			this.removeLayer(this._layers[i]);
		}
		return this;
	},

	// @method invoke(methodName: String, …): this
	// Calls `methodName` on every layer contained in this group, passing any
	// additional parameters. Has no effect if the layers contained do not
	// implement `methodName`.
	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		for (var i in this._layers) {
			map.addLayer(this._layers[i]);
		}
	},

	onRemove: function (map) {
		for (var i in this._layers) {
			map.removeLayer(this._layers[i]);
		}
	},

	// @method eachLayer(fn: Function, context?: Object): this
	// Iterates over the layers of the group, optionally specifying context of the iterator function.
	// ```js
	// group.eachLayer(function (layer) {
	// 	layer.bindPopup('Hello');
	// });
	// ```
	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	// @method getLayer(id: Number): Layer
	// Returns the layer with the given internal ID.
	getLayer: function (id) {
		return this._layers[id];
	},

	// @method getLayers(): Layer[]
	// Returns an array of all the layers added to the group.
	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	// @method setZIndex(zIndex: Number): this
	// Calls `setZIndex` on every layer contained in this group, passing the z-index.
	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	// @method getLayerId(layer: Layer): Number
	// Returns the internal ID for a layer
	getLayerId: function (layer) {
		return L.stamp(layer);
	}
});


// @factory L.layerGroup(layers: Layer[])
// Create a layer group, optionally given an initial set of layers.
L.layerGroup = function (layers) {
	return new L.LayerGroup(layers);
};



/*
 * @class FeatureGroup
 * @aka L.FeatureGroup
 * @inherits LayerGroup
 *
 * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
 *  * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once (likewise with [`bindTooltip`](#layer-bindtooltip))
 *  * Events are propagated to the `FeatureGroup`, so if the group has an event
 * handler, it will handle events from any of the layers. This includes mouse events
 * and custom events.
 *  * Has `layeradd` and `layerremove` events
 *
 * @example
 *
 * ```js
 * L.featureGroup([marker1, marker2, polyline])
 * 	.bindPopup('Hello world!')
 * 	.on('click', function() { alert('Clicked on a member of the group!'); })
 * 	.addTo(map);
 * ```
 */

L.FeatureGroup = L.LayerGroup.extend({

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		layer.addEventParent(this);

		L.LayerGroup.prototype.addLayer.call(this, layer);

		// @event layeradd: LayerEvent
		// Fired when a layer is added to this `FeatureGroup`
		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.removeEventParent(this);

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		// @event layerremove: LayerEvent
		// Fired when a layer is removed from this `FeatureGroup`
		return this.fire('layerremove', {layer: layer});
	},

	// @method setStyle(style: Path options): this
	// Sets the given path options to each layer of the group that has a `setStyle` method.
	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	// @method bringToFront(): this
	// Brings the layer group to the top of all other layers
	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	// @method bringToBack(): this
	// Brings the layer group to the top of all other layers
	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	// @method getBounds(): LatLngBounds
	// Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
	getBounds: function () {
		var bounds = new L.LatLngBounds();

		for (var id in this._layers) {
			var layer = this._layers[id];
			bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
		}
		return bounds;
	}
});

// @factory L.featureGroup(layers: Layer[])
// Create a feature group, optionally given an initial set of layers.
L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};



/*
 * @class Renderer
 * @inherits Layer
 * @aka L.Renderer
 *
 * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
 * DOM container of the renderer, its bounds, and its zoom animation.
 *
 * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
 * itself can be added or removed to the map. All paths use a renderer, which can
 * be implicit (the map will decide the type of renderer and use it automatically)
 * or explicit (using the [`renderer`](#path-renderer) option of the path).
 *
 * Do not use this class directly, use `SVG` and `Canvas` instead.
 *
 * @event update: Event
 * Fired when the renderer updates its bounds, center and zoom, for example when
 * its map has moved
 */

L.Renderer = L.Layer.extend({

	// @section
	// @aka Renderer options
	options: {
		// @option padding: Number = 0.1
		// How much to extend the clip area around the map view (relative to its size)
		// e.g. 0.1 would be 10% of map view in each direction
		padding: 0.1
	},

	initialize: function (options) {
		L.setOptions(this, options);
		L.stamp(this);
	},

	onAdd: function () {
		if (!this._container) {
			this._initContainer(); // defined by renderer implementations

			if (this._zoomAnimated) {
				L.DomUtil.addClass(this._container, 'leaflet-zoom-animated');
			}
		}

		this.getPane().appendChild(this._container);
		this._update();
	},

	onRemove: function () {
		L.DomUtil.remove(this._container);
	},

	getEvents: function () {
		var events = {
			viewreset: this._reset,
			zoom: this._onZoom,
			moveend: this._update
		};
		if (this._zoomAnimated) {
			events.zoomanim = this._onAnimZoom;
		}
		return events;
	},

	_onAnimZoom: function (ev) {
		this._updateTransform(ev.center, ev.zoom);
	},

	_onZoom: function () {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	},

	_updateTransform: function (center, zoom) {
		var scale = this._map.getZoomScale(zoom, this._zoom),
		    position = L.DomUtil.getPosition(this._container),
		    viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
		    currentCenterPoint = this._map.project(this._center, zoom),
		    destCenterPoint = this._map.project(center, zoom),
		    centerOffset = destCenterPoint.subtract(currentCenterPoint),

		    topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(this._container, topLeftOffset, scale);
		} else {
			L.DomUtil.setPosition(this._container, topLeftOffset);
		}
	},

	_reset: function () {
		this._update();
		this._updateTransform(this._center, this._zoom);
	},

	_update: function () {
		// Update pixel bounds of renderer container (for positioning/sizing/clipping later)
		// Subclasses are responsible of firing the 'update' event.
		var p = this.options.padding,
		    size = this._map.getSize(),
		    min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

		this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
	}
});


L.Map.include({
	// @namespace Map; @method getRenderer(layer: Path): Renderer
	// Returns the instance of `Renderer` that should be used to render the given
	// `Path`. It will ensure that the `renderer` options of the map and paths
	// are respected, and that the renderers do exist on the map.
	getRenderer: function (layer) {
		// @namespace Path; @option renderer: Renderer
		// Use this specific instance of `Renderer` for this path. Takes
		// precedence over the map's [default renderer](#map-renderer).
		var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;

		if (!renderer) {
			// @namespace Map; @option preferCanvas: Boolean = false
			// Whether `Path`s should be rendered on a `Canvas` renderer.
			// By default, all `Path`s are rendered in a `SVG` renderer.
			renderer = this._renderer = (this.options.preferCanvas && L.canvas()) || L.svg();
		}

		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	_getPaneRenderer: function (name) {
		if (name === 'overlayPane' || name === undefined) {
			return false;
		}

		var renderer = this._paneRenderers[name];
		if (renderer === undefined) {
			renderer = (L.SVG && L.svg({pane: name})) || (L.Canvas && L.canvas({pane: name}));
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	}
});



/*
 * @class Path
 * @aka L.Path
 * @inherits Interactive layer
 *
 * An abstract class that contains options and constants shared between vector
 * overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
 */

L.Path = L.Layer.extend({

	// @section
	// @aka Path options
	options: {
		// @option stroke: Boolean = true
		// Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
		stroke: true,

		// @option color: String = '#3388ff'
		// Stroke color
		color: '#3388ff',

		// @option weight: Number = 3
		// Stroke width in pixels
		weight: 3,

		// @option opacity: Number = 1.0
		// Stroke opacity
		opacity: 1,

		// @option lineCap: String= 'round'
		// A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
		lineCap: 'round',

		// @option lineJoin: String = 'round'
		// A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
		lineJoin: 'round',

		// @option dashArray: String = null
		// A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
		dashArray: null,

		// @option dashOffset: String = null
		// A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
		dashOffset: null,

		// @option fill: Boolean = depends
		// Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
		fill: false,

		// @option fillColor: String = *
		// Fill color. Defaults to the value of the [`color`](#path-color) option
		fillColor: null,

		// @option fillOpacity: Number = 0.2
		// Fill opacity.
		fillOpacity: 0.2,

		// @option fillRule: String = 'evenodd'
		// A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
		fillRule: 'evenodd',

		// className: '',

		// Option inherited from "Interactive layer" abstract class
		interactive: true
	},

	beforeAdd: function (map) {
		// Renderer is set here because we need to call renderer.getEvents
		// before this.getEvents.
		this._renderer = map.getRenderer(this);
	},

	onAdd: function () {
		this._renderer._initPath(this);
		this._reset();
		this._renderer._addPath(this);
		this._renderer.on('update', this._update, this);
	},

	onRemove: function () {
		this._renderer._removePath(this);
		this._renderer.off('update', this._update, this);
	},

	getEvents: function () {
		return {
			zoomend: this._project,
			viewreset: this._reset
		};
	},

	// @method redraw(): this
	// Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
	redraw: function () {
		if (this._map) {
			this._renderer._updatePath(this);
		}
		return this;
	},

	// @method setStyle(style: Path options): this
	// Changes the appearance of a Path based on the options in the `Path options` object.
	setStyle: function (style) {
		L.setOptions(this, style);
		if (this._renderer) {
			this._renderer._updateStyle(this);
		}
		return this;
	},

	// @method bringToFront(): this
	// Brings the layer to the top of all path layers.
	bringToFront: function () {
		if (this._renderer) {
			this._renderer._bringToFront(this);
		}
		return this;
	},

	// @method bringToBack(): this
	// Brings the layer to the bottom of all path layers.
	bringToBack: function () {
		if (this._renderer) {
			this._renderer._bringToBack(this);
		}
		return this;
	},

	getElement: function () {
		return this._path;
	},

	_reset: function () {
		// defined in children classes
		this._project();
		this._update();
	},

	_clickTolerance: function () {
		// used when doing hit detection for Canvas layers
		return (this.options.stroke ? this.options.weight / 2 : 0) + (L.Browser.touch ? 10 : 0);
	}
});



/*
 * @namespace LineUtil
 *
 * Various utility functions for polyine points processing, used by Leaflet internally to make polylines lightning-fast.
 */

L.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	// @function simplify(points: Point[], tolerance: Number): Point[]
	// Dramatically reduces the number of points in a polyline while retaining
	// its shape and returns a new array of simplified points, using the
	// [Douglas-Peucker algorithm](http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm).
	// Used for a huge performance boost when processing/displaying Leaflet polylines for
	// each zoom level and also reducing visual noise. tolerance affects the amount of
	// simplification (lesser value means higher quality but slower and with more points).
	// Also released as a separated micro-library [Simplify.js](http://mourner.github.com/simplify-js/).
	simplify: function (points, tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// @function pointToSegmentDistance(p: Point, p1: Point, p2: Point): Number
	// Returns the distance between point `p` and segment `p1` to `p2`.
	pointToSegmentDistance:  function (p, p1, p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	// @function closestPointOnSegment(p: Point, p1: Point, p2: Point): Number
	// Returns the closest point from a point `p` on a segment `p1` to `p2`.
	closestPointOnSegment: function (p, p1, p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},


	// @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
	// Clips the segment a to b by rectangular bounds with the
	// [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
	// (modifying the segment points directly!). Used by Leaflet to only show polyline
	// points that are on the screen or near, increasing performance.
	clipSegment: function (a, b, bounds, useLastCode, round) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			}

			// if a,b is outside the clip window (trivial reject)
			if (codeA & codeB) {
				return false;
			}

			// other cases
			codeOut = codeA || codeB;
			p = this._getEdgeIntersection(a, b, codeOut, bounds, round);
			newCode = this._getBitCode(p, bounds);

			if (codeOut === codeA) {
				a = p;
				codeA = newCode;
			} else {
				b = p;
				codeB = newCode;
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds, round) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max,
		    x, y;

		if (code & 8) { // top
			x = a.x + dx * (max.y - a.y) / dy;
			y = max.y;

		} else if (code & 4) { // bottom
			x = a.x + dx * (min.y - a.y) / dy;
			y = min.y;

		} else if (code & 2) { // right
			x = max.x;
			y = a.y + dy * (max.x - a.x) / dx;

		} else if (code & 1) { // left
			x = min.x;
			y = a.y + dy * (min.x - a.x) / dx;
		}

		return new L.Point(x, y, round);
	},

	_getBitCode: function (p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}

		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
	}
};



/*
 * @class Polyline
 * @aka L.Polyline
 * @inherits Path
 *
 * A class for drawing polyline overlays on a map. Extends `Path`.
 *
 * @example
 *
 * ```js
 * // create a red polyline from an array of LatLng points
 * var latlngs = [
 * 	[-122.68, 45.51],
 * 	[-122.43, 37.77],
 * 	[-118.2, 34.04]
 * ];
 *
 * var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
 *
 * // zoom the map to the polyline
 * map.fitBounds(polyline.getBounds());
 * ```
 *
 * You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
 *
 * ```js
 * // create a red polyline from an array of arrays of LatLng points
 * var latlngs = [
 * 	[[-122.68, 45.51],
 * 	 [-122.43, 37.77],
 * 	 [-118.2, 34.04]],
 * 	[[-73.91, 40.78],
 * 	 [-87.62, 41.83],
 * 	 [-96.72, 32.76]]
 * ];
 * ```
 */

L.Polyline = L.Path.extend({

	// @section
	// @aka Polyline options
	options: {
		// @option smoothFactor: Number = 1.0
		// How much to simplify the polyline on each zoom level. More means
		// better performance and smoother look, and less means more accurate representation.
		smoothFactor: 1.0,

		// @option noClip: Boolean = false
		// Disable polyline clipping.
		noClip: false
	},

	initialize: function (latlngs, options) {
		L.setOptions(this, options);
		this._setLatLngs(latlngs);
	},

	// @method getLatLngs(): LatLng[]
	// Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
	getLatLngs: function () {
		return this._latlngs;
	},

	// @method setLatLngs(latlngs: LatLng[]): this
	// Replaces all the points in the polyline with the given array of geographical points.
	setLatLngs: function (latlngs) {
		this._setLatLngs(latlngs);
		return this.redraw();
	},

	// @method isEmpty(): Boolean
	// Returns `true` if the Polyline has no LatLngs.
	isEmpty: function () {
		return !this._latlngs.length;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity,
		    minPoint = null,
		    closest = L.LineUtil._sqClosestPointOnSegment,
		    p1, p2;

		for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
			var points = this._parts[j];

			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];

				var sqDist = closest(p, p1, p2, true);

				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = closest(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	// @method getCenter(): LatLng
	// Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the polyline.
	getCenter: function () {
		// throws error when not yet added to map as this center calculation requires projected coordinates
		if (!this._map) {
			throw new Error('Must add layer to map before using getCenter()');
		}

		var i, halfDist, segDist, dist, p1, p2, ratio,
		    points = this._rings[0],
		    len = points.length;

		if (!len) { return null; }

		// polyline centroid algorithm; only uses the first ring if there are multiple

		for (i = 0, halfDist = 0; i < len - 1; i++) {
			halfDist += points[i].distanceTo(points[i + 1]) / 2;
		}

		// The line is so small in the current view that all points are on the same pixel.
		if (halfDist === 0) {
			return this._map.layerPointToLatLng(points[0]);
		}

		for (i = 0, dist = 0; i < len - 1; i++) {
			p1 = points[i];
			p2 = points[i + 1];
			segDist = p1.distanceTo(p2);
			dist += segDist;

			if (dist > halfDist) {
				ratio = (dist - halfDist) / segDist;
				return this._map.layerPointToLatLng([
					p2.x - ratio * (p2.x - p1.x),
					p2.y - ratio * (p2.y - p1.y)
				]);
			}
		}
	},

	// @method getBounds(): LatLngBounds
	// Returns the `LatLngBounds` of the path.
	getBounds: function () {
		return this._bounds;
	},

	// @method addLatLng(latlng: LatLng, latlngs? LatLng[]): this
	// Adds a given point to the polyline. By default, adds to the first ring of
	// the polyline in case of a multi-polyline, but can be overridden by passing
	// a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
	addLatLng: function (latlng, latlngs) {
		latlngs = latlngs || this._defaultShape();
		latlng = L.latLng(latlng);
		latlngs.push(latlng);
		this._bounds.extend(latlng);
		return this.redraw();
	},

	_setLatLngs: function (latlngs) {
		this._bounds = new L.LatLngBounds();
		this._latlngs = this._convertLatLngs(latlngs);
	},

	_defaultShape: function () {
		return L.Polyline._flat(this._latlngs) ? this._latlngs : this._latlngs[0];
	},

	// recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
	_convertLatLngs: function (latlngs) {
		var result = [],
		    flat = L.Polyline._flat(latlngs);

		for (var i = 0, len = latlngs.length; i < len; i++) {
			if (flat) {
				result[i] = L.latLng(latlngs[i]);
				this._bounds.extend(result[i]);
			} else {
				result[i] = this._convertLatLngs(latlngs[i]);
			}
		}

		return result;
	},

	_project: function () {
		var pxBounds = new L.Bounds();
		this._rings = [];
		this._projectLatlngs(this._latlngs, this._rings, pxBounds);

		var w = this._clickTolerance(),
		    p = new L.Point(w, w);

		if (this._bounds.isValid() && pxBounds.isValid()) {
			pxBounds.min._subtract(p);
			pxBounds.max._add(p);
			this._pxBounds = pxBounds;
		}
	},

	// recursively turns latlngs into a set of rings with projected coordinates
	_projectLatlngs: function (latlngs, result, projectedBounds) {
		var flat = latlngs[0] instanceof L.LatLng,
		    len = latlngs.length,
		    i, ring;

		if (flat) {
			ring = [];
			for (i = 0; i < len; i++) {
				ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
				projectedBounds.extend(ring[i]);
			}
			result.push(ring);
		} else {
			for (i = 0; i < len; i++) {
				this._projectLatlngs(latlngs[i], result, projectedBounds);
			}
		}
	},

	// clip polyline by renderer bounds so that we have less to render for performance
	_clipPoints: function () {
		var bounds = this._renderer._bounds;

		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
			return;
		}

		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}

		var parts = this._parts,
		    i, j, k, len, len2, segment, points;

		for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
			points = this._rings[i];

			for (j = 0, len2 = points.length; j < len2 - 1; j++) {
				segment = L.LineUtil.clipSegment(points[j], points[j + 1], bounds, j, true);

				if (!segment) { continue; }

				parts[k] = parts[k] || [];
				parts[k].push(segment[0]);

				// if segment goes out of screen, or it's the last one, it's the end of the line part
				if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
					parts[k].push(segment[1]);
					k++;
				}
			}
		}
	},

	// simplify each clipped part of the polyline for performance
	_simplifyPoints: function () {
		var parts = this._parts,
		    tolerance = this.options.smoothFactor;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = L.LineUtil.simplify(parts[i], tolerance);
		}
	},

	_update: function () {
		if (!this._map) { return; }

		this._clipPoints();
		this._simplifyPoints();
		this._updatePath();
	},

	_updatePath: function () {
		this._renderer._updatePoly(this);
	}
});

// @factory L.polyline(latlngs: LatLng[], options?: Polyline options)
// Instantiates a polyline object given an array of geographical points and
// optionally an options object. You can create a `Polyline` object with
// multiple separate lines (`MultiPolyline`) by passing an array of arrays
// of geographic points.
L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};

L.Polyline._flat = function (latlngs) {
	// true if it's a flat array of latlngs; false if nested
	return !L.Util.isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
};



/*
 * @namespace PolyUtil
 * Various utility functions for polygon geometries.
 */

L.PolyUtil = {};

/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgeman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a seperate method for it.
 */
L.PolyUtil.clipPolygon = function (points, bounds, round) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = L.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds, round);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds, round);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};



/*
 * @class Polygon
 * @aka L.Polygon
 * @inherits Polyline
 *
 * A class for drawing polygon overlays on a map. Extends `Polyline`.
 *
 * Note that points you pass when creating a polygon shouldn't have an additional last point equal to the first one — it's better to filter out such points.
 *
 *
 * @example
 *
 * ```js
 * // create a red polygon from an array of LatLng points
 * var latlngs = [[-111.03, 41],[-111.04, 45],[-104.05, 45],[-104.05, 41]];
 *
 * var polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
 *
 * // zoom the map to the polygon
 * map.fitBounds(polygon.getBounds());
 * ```
 *
 * You can also pass an array of arrays of latlngs, with the first array representing the outer shape and the other arrays representing holes in the outer shape:
 *
 * ```js
 * var latlngs = [
 *   [[-111.03, 41],[-111.04, 45],[-104.05, 45],[-104.05, 41]], // outer ring
 *   [[-108.58,37.29],[-108.58,40.71],[-102.50,40.71],[-102.50,37.29]] // hole
 * ];
 * ```
 *
 * Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
 *
 * ```js
 * var latlngs = [
 *   [ // first polygon
 *     [[-111.03, 41],[-111.04, 45],[-104.05, 45],[-104.05, 41]], // outer ring
 *     [[-108.58,37.29],[-108.58,40.71],[-102.50,40.71],[-102.50,37.29]] // hole
 *   ],
 *   [ // second polygon
 *     [[-109.05, 37],[-109.03, 41],[-102.05, 41],[-102.04, 37],[-109.05, 38]]
 *   ]
 * ];
 * ```
 */

L.Polygon = L.Polyline.extend({

	options: {
		fill: true
	},

	isEmpty: function () {
		return !this._latlngs.length || !this._latlngs[0].length;
	},

	getCenter: function () {
		// throws error when not yet added to map as this center calculation requires projected coordinates
		if (!this._map) {
			throw new Error('Must add layer to map before using getCenter()');
		}

		var i, j, p1, p2, f, area, x, y, center,
		    points = this._rings[0],
		    len = points.length;

		if (!len) { return null; }

		// polygon centroid algorithm; only uses the first ring if there are multiple

		area = x = y = 0;

		for (i = 0, j = len - 1; i < len; j = i++) {
			p1 = points[i];
			p2 = points[j];

			f = p1.y * p2.x - p2.y * p1.x;
			x += (p1.x + p2.x) * f;
			y += (p1.y + p2.y) * f;
			area += f * 3;
		}

		if (area === 0) {
			// Polygon is so small that all points are on same pixel.
			center = points[0];
		} else {
			center = [x / area, y / area];
		}
		return this._map.layerPointToLatLng(center);
	},

	_convertLatLngs: function (latlngs) {
		var result = L.Polyline.prototype._convertLatLngs.call(this, latlngs),
		    len = result.length;

		// remove last point if it equals first one
		if (len >= 2 && result[0] instanceof L.LatLng && result[0].equals(result[len - 1])) {
			result.pop();
		}
		return result;
	},

	_setLatLngs: function (latlngs) {
		L.Polyline.prototype._setLatLngs.call(this, latlngs);
		if (L.Polyline._flat(this._latlngs)) {
			this._latlngs = [this._latlngs];
		}
	},

	_defaultShape: function () {
		return L.Polyline._flat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
	},

	_clipPoints: function () {
		// polygons need a different clipping algorithm so we redefine that

		var bounds = this._renderer._bounds,
		    w = this.options.weight,
		    p = new L.Point(w, w);

		// increase clip padding by stroke width to avoid stroke on clip edges
		bounds = new L.Bounds(bounds.min.subtract(p), bounds.max.add(p));

		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
			return;
		}

		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}

		for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
			clipped = L.PolyUtil.clipPolygon(this._rings[i], bounds, true);
			if (clipped.length) {
				this._parts.push(clipped);
			}
		}
	},

	_updatePath: function () {
		this._renderer._updatePoly(this, true);
	}
});


// @factory L.polygon(latlngs: LatLng[], options?: Polyline options)
L.polygon = function (latlngs, options) {
	return new L.Polygon(latlngs, options);
};



/*
 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

/*
 * @class Rectangle
 * @aka L.Retangle
 * @inherits Polygon
 *
 * A class for drawing rectangle overlays on a map. Extends `Polygon`.
 *
 * @example
 *
 * ```js
 * // define rectangle geographical bounds
 * var bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
 *
 * // create an orange rectangle
 * L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
 *
 * // zoom the map to the rectangle bounds
 * map.fitBounds(bounds);
 * ```
 *
 */


L.Rectangle = L.Polygon.extend({
	initialize: function (latLngBounds, options) {
		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	// @method setBounds(latLngBounds: LatLngBounds): this
	// Redraws the rectangle with the passed bounds.
	setBounds: function (latLngBounds) {
		return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = L.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});


// @factory L.rectangle(latLngBounds: LatLngBounds, options?: Polyline options)
L.rectangle = function (latLngBounds, options) {
	return new L.Rectangle(latLngBounds, options);
};



/*
 * @class CircleMarker
 * @aka L.CircleMarker
 * @inherits Path
 *
 * A circle of a fixed size with radius specified in pixels. Extends `Path`.
 */

L.CircleMarker = L.Path.extend({

	// @section
	// @aka CircleMarker options
	options: {
		fill: true,

		// @option radius: Number = 10
		// Radius of the circle marker, in pixels
		radius: 10
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
		this._radius = this.options.radius;
	},

	// @method setLatLng(latLng: LatLng): this
	// Sets the position of a circle marker to a new location.
	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		this.redraw();
		return this.fire('move', {latlng: this._latlng});
	},

	// @method getLatLng(): LatLng
	// Returns the current geographical position of the circle marker
	getLatLng: function () {
		return this._latlng;
	},

	// @method setRadius(radius: Number): this
	// Sets the radius of a circle marker. Units are in pixels.
	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	// @method getRadius(): Number
	// Returns the current radius of the circle
	getRadius: function () {
		return this._radius;
	},

	setStyle : function (options) {
		var radius = options && options.radius || this._radius;
		L.Path.prototype.setStyle.call(this, options);
		this.setRadius(radius);
		return this;
	},

	_project: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
		this._updateBounds();
	},

	_updateBounds: function () {
		var r = this._radius,
		    r2 = this._radiusY || r,
		    w = this._clickTolerance(),
		    p = [r + w, r2 + w];
		this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
	},

	_update: function () {
		if (this._map) {
			this._updatePath();
		}
	},

	_updatePath: function () {
		this._renderer._updateCircle(this);
	},

	_empty: function () {
		return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
	}
});


// @factory L.circleMarker(latlng: LatLng, options?: CircleMarker options)
// Instantiates a circle marker object given a geographical point, and an optional options object.
L.circleMarker = function (latlng, options) {
	return new L.CircleMarker(latlng, options);
};



/*
 * @class Circle
 * @aka L.Circle
 * @inherits CircleMarker
 *
 * A class for drawing circle overlays on a map. Extends `CircleMarker`.
 *
 * It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion).
 *
 * @example
 *
 * ```js
 * L.circle([50.5, 30.5], {radius: 200}).addTo(map);
 * ```
 */

L.Circle = L.CircleMarker.extend({

	initialize: function (latlng, options, legacyOptions) {
		if (typeof options === 'number') {
			// Backwards compatibility with 0.7.x factory (latlng, radius, options?)
			options = L.extend({}, legacyOptions, {radius: options});
		}
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);

		if (isNaN(this.options.radius)) { throw new Error('Circle radius cannot be NaN'); }

		// @section
		// @aka Circle options
		// @option radius: Number; Radius of the circle, in meters.
		this._mRadius = this.options.radius;
	},

	// @method setRadius(radius: Number): this
	// Sets the radius of a circle. Units are in meters.
	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	// @method getRadius(): Number
	// Returns the current radius of a circle. Units are in meters.
	getRadius: function () {
		return this._mRadius;
	},

	// @method getBounds(): LatLngBounds
	// Returns the `LatLngBounds` of the path.
	getBounds: function () {
		var half = [this._radius, this._radiusY || this._radius];

		return new L.LatLngBounds(
			this._map.layerPointToLatLng(this._point.subtract(half)),
			this._map.layerPointToLatLng(this._point.add(half)));
	},

	setStyle: L.Path.prototype.setStyle,

	_project: function () {

		var lng = this._latlng.lng,
		    lat = this._latlng.lat,
		    map = this._map,
		    crs = map.options.crs;

		if (crs.distance === L.CRS.Earth.distance) {
			var d = Math.PI / 180,
			    latR = (this._mRadius / L.CRS.Earth.R) / d,
			    top = map.project([lat + latR, lng]),
			    bottom = map.project([lat - latR, lng]),
			    p = top.add(bottom).divideBy(2),
			    lat2 = map.unproject(p).lat,
			    lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
			            (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

			if (isNaN(lngR) || lngR === 0) {
				lngR = latR / Math.cos(Math.PI / 180 * lat); // Fallback for edge case, #2425
			}

			this._point = p.subtract(map.getPixelOrigin());
			this._radius = isNaN(lngR) ? 0 : Math.max(Math.round(p.x - map.project([lat2, lng - lngR]).x), 1);
			this._radiusY = Math.max(Math.round(p.y - top.y), 1);

		} else {
			var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));

			this._point = map.latLngToLayerPoint(this._latlng);
			this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
		}

		this._updateBounds();
	}
});

// @factory L.circle(latlng: LatLng, options?: Circle options)
// Instantiates a circle object given a geographical point, and an options object
// which contains the circle radius.
// @alternative
// @factory L.circle(latlng: LatLng, radius: Number, options?: Circle options)
// Obsolete way of instantiating a circle, for compatibility with 0.7.x code.
// Do not use in new applications or plugins.
L.circle = function (latlng, options, legacyOptions) {
	return new L.Circle(latlng, options, legacyOptions);
};



/*
 * @class SVG
 * @inherits Renderer
 * @aka L.SVG
 *
 * Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
 * Inherits `Renderer`.
 *
 * Due to [technical limitations](http://caniuse.com/#search=svg), SVG is not
 * available in all web browsers, notably Android 2.x and 3.x.
 *
 * Although SVG is not available on IE7 and IE8, these browsers support
 * [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language)
 * (a now deprecated technology), and the SVG renderer will fall back to VML in
 * this case.
 *
 * @example
 *
 * Use SVG by default for all paths in the map:
 *
 * ```js
 * var map = L.map('map', {
 * 	renderer: L.svg()
 * });
 * ```
 *
 * Use a SVG renderer with extra padding for specific vector geometries:
 *
 * ```js
 * var map = L.map('map');
 * var myRenderer = L.svg({ padding: 0.5 });
 * var line = L.polyline( coordinates, { renderer: myRenderer } );
 * var circle = L.circle( center, { renderer: myRenderer } );
 * ```
 */

L.SVG = L.Renderer.extend({

	getEvents: function () {
		var events = L.Renderer.prototype.getEvents.call(this);
		events.zoomstart = this._onZoomStart;
		return events;
	},

	_initContainer: function () {
		this._container = L.SVG.create('svg');

		// makes it possible to click through svg root; we'll reset it back in individual paths
		this._container.setAttribute('pointer-events', 'none');

		this._rootGroup = L.SVG.create('g');
		this._container.appendChild(this._rootGroup);
	},

	_onZoomStart: function () {
		// Drag-then-pinch interactions might mess up the center and zoom.
		// In this case, the easiest way to prevent this is re-do the renderer
		//   bounds and padding when the zooming starts.
		this._update();
	},

	_update: function () {
		if (this._map._animatingZoom && this._bounds) { return; }

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    size = b.getSize(),
		    container = this._container;

		// set size of svg-container if changed
		if (!this._svgSize || !this._svgSize.equals(size)) {
			this._svgSize = size;
			container.setAttribute('width', size.x);
			container.setAttribute('height', size.y);
		}

		// movement: update container viewBox so that we don't have to change coordinates of individual layers
		L.DomUtil.setPosition(container, b.min);
		container.setAttribute('viewBox', [b.min.x, b.min.y, size.x, size.y].join(' '));

		this.fire('update');
	},

	// methods below are called by vector layers implementations

	_initPath: function (layer) {
		var path = layer._path = L.SVG.create('path');

		// @namespace Path
		// @option className: String = null
		// Custom class name set on an element. Only for SVG renderer.
		if (layer.options.className) {
			L.DomUtil.addClass(path, layer.options.className);
		}

		if (layer.options.interactive) {
			L.DomUtil.addClass(path, 'leaflet-interactive');
		}

		this._updateStyle(layer);
	},

	_addPath: function (layer) {
		this._rootGroup.appendChild(layer._path);
		layer.addInteractiveTarget(layer._path);
	},

	_removePath: function (layer) {
		L.DomUtil.remove(layer._path);
		layer.removeInteractiveTarget(layer._path);
	},

	_updatePath: function (layer) {
		layer._project();
		layer._update();
	},

	_updateStyle: function (layer) {
		var path = layer._path,
		    options = layer.options;

		if (!path) { return; }

		if (options.stroke) {
			path.setAttribute('stroke', options.color);
			path.setAttribute('stroke-opacity', options.opacity);
			path.setAttribute('stroke-width', options.weight);
			path.setAttribute('stroke-linecap', options.lineCap);
			path.setAttribute('stroke-linejoin', options.lineJoin);

			if (options.dashArray) {
				path.setAttribute('stroke-dasharray', options.dashArray);
			} else {
				path.removeAttribute('stroke-dasharray');
			}

			if (options.dashOffset) {
				path.setAttribute('stroke-dashoffset', options.dashOffset);
			} else {
				path.removeAttribute('stroke-dashoffset');
			}
		} else {
			path.setAttribute('stroke', 'none');
		}

		if (options.fill) {
			path.setAttribute('fill', options.fillColor || options.color);
			path.setAttribute('fill-opacity', options.fillOpacity);
			path.setAttribute('fill-rule', options.fillRule || 'evenodd');
		} else {
			path.setAttribute('fill', 'none');
		}
	},

	_updatePoly: function (layer, closed) {
		this._setPath(layer, L.SVG.pointsToPath(layer._parts, closed));
	},

	_updateCircle: function (layer) {
		var p = layer._point,
		    r = layer._radius,
		    r2 = layer._radiusY || r,
		    arc = 'a' + r + ',' + r2 + ' 0 1,0 ';

		// drawing a circle with two half-arcs
		var d = layer._empty() ? 'M0 0' :
				'M' + (p.x - r) + ',' + p.y +
				arc + (r * 2) + ',0 ' +
				arc + (-r * 2) + ',0 ';

		this._setPath(layer, d);
	},

	_setPath: function (layer, path) {
		layer._path.setAttribute('d', path);
	},

	// SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
	_bringToFront: function (layer) {
		L.DomUtil.toFront(layer._path);
	},

	_bringToBack: function (layer) {
		L.DomUtil.toBack(layer._path);
	}
});


// @namespace SVG; @section
// There are several static functions which can be called without instantiating L.SVG:
L.extend(L.SVG, {
	// @function create(name: String): SVGElement
	// Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
	// corresponding to the class name passed. For example, using 'line' will return
	// an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
	create: function (name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	},

	// @function pointsToPath(rings: Point[], closed: Boolean): String
	// Generates a SVG path string for multiple rings, with each ring turning
	// into "M..L..L.." instructions
	pointsToPath: function (rings, closed) {
		var str = '',
		    i, j, len, len2, points, p;

		for (i = 0, len = rings.length; i < len; i++) {
			points = rings[i];

			for (j = 0, len2 = points.length; j < len2; j++) {
				p = points[j];
				str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
			}

			// closes the ring for polygons; "x" is VML syntax
			str += closed ? (L.Browser.svg ? 'z' : 'x') : '';
		}

		// SVG complains about empty path strings
		return str || 'M0 0';
	}
});

// @namespace Browser; @property svg: Boolean
// `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).
L.Browser.svg = !!(document.createElementNS && L.SVG.create('svg').createSVGRect);


// @namespace SVG
// @factory L.svg(options?: Renderer options)
// Creates a SVG renderer with the given options.
L.svg = function (options) {
	return L.Browser.svg || L.Browser.vml ? new L.SVG(options) : null;
};



/*
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

/*
 * @class SVG
 *
 * Although SVG is not available on IE7 and IE8, these browsers support [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language), and the SVG renderer will fall back to VML in this case.
 *
 * VML was deprecated in 2012, which means VML functionality exists only for backwards compatibility
 * with old versions of Internet Explorer.
 */

// @namespace Browser; @property vml: Boolean
// `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).
L.Browser.vml = !L.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

// redefine some SVG methods to handle VML syntax which is similar but with some differences
L.SVG.include(!L.Browser.vml ? {} : {

	_initContainer: function () {
		this._container = L.DomUtil.create('div', 'leaflet-vml-container');
	},

	_update: function () {
		if (this._map._animatingZoom) { return; }
		L.Renderer.prototype._update.call(this);
		this.fire('update');
	},

	_initPath: function (layer) {
		var container = layer._container = L.SVG.create('shape');

		L.DomUtil.addClass(container, 'leaflet-vml-shape ' + (this.options.className || ''));

		container.coordsize = '1 1';

		layer._path = L.SVG.create('path');
		container.appendChild(layer._path);

		this._updateStyle(layer);
	},

	_addPath: function (layer) {
		var container = layer._container;
		this._container.appendChild(container);

		if (layer.options.interactive) {
			layer.addInteractiveTarget(container);
		}
	},

	_removePath: function (layer) {
		var container = layer._container;
		L.DomUtil.remove(container);
		layer.removeInteractiveTarget(container);
	},

	_updateStyle: function (layer) {
		var stroke = layer._stroke,
		    fill = layer._fill,
		    options = layer.options,
		    container = layer._container;

		container.stroked = !!options.stroke;
		container.filled = !!options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = layer._stroke = L.SVG.create('stroke');
			}
			container.appendChild(stroke);
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = L.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			stroke.endcap = options.lineCap.replace('butt', 'flat');
			stroke.joinstyle = options.lineJoin;

		} else if (stroke) {
			container.removeChild(stroke);
			layer._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = layer._fill = L.SVG.create('fill');
			}
			container.appendChild(fill);
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			layer._fill = null;
		}
	},

	_updateCircle: function (layer) {
		var p = layer._point.round(),
		    r = Math.round(layer._radius),
		    r2 = Math.round(layer._radiusY || r);

		this._setPath(layer, layer._empty() ? 'M0 0' :
				'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r2 + ' 0,' + (65535 * 360));
	},

	_setPath: function (layer, path) {
		layer._path.v = path;
	},

	_bringToFront: function (layer) {
		L.DomUtil.toFront(layer._container);
	},

	_bringToBack: function (layer) {
		L.DomUtil.toBack(layer._container);
	}
});

if (L.Browser.vml) {
	L.SVG.create = (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement('<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	})();
}



/*
 * @class Canvas
 * @inherits Renderer
 * @aka L.Canvas
 *
 * Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
 * Inherits `Renderer`.
 *
 * Due to [technical limitations](http://caniuse.com/#search=canvas), Canvas is not
 * available in all web browsers, notably IE8, and overlapping geometries might
 * not display properly in some edge cases.
 *
 * @example
 *
 * Use Canvas by default for all paths in the map:
 *
 * ```js
 * var map = L.map('map', {
 * 	renderer: L.canvas()
 * });
 * ```
 *
 * Use a Canvas renderer with extra padding for specific vector geometries:
 *
 * ```js
 * var map = L.map('map');
 * var myRenderer = L.canvas({ padding: 0.5 });
 * var line = L.polyline( coordinates, { renderer: myRenderer } );
 * var circle = L.circle( center, { renderer: myRenderer } );
 * ```
 */

L.Canvas = L.Renderer.extend({

	onAdd: function () {
		L.Renderer.prototype.onAdd.call(this);

		this._layers = this._layers || {};

		// Redraw vectors since canvas is cleared upon removal,
		// in case of removing the renderer itself from the map.
		this._draw();
	},

	_initContainer: function () {
		var container = this._container = document.createElement('canvas');

		L.DomEvent
			.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this)
			.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this)
			.on(container, 'mouseout', this._handleMouseOut, this);

		this._ctx = container.getContext('2d');
	},

	_update: function () {
		if (this._map._animatingZoom && this._bounds) { return; }

		this._drawnLayers = {};

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    container = this._container,
		    size = b.getSize(),
		    m = L.Browser.retina ? 2 : 1;

		L.DomUtil.setPosition(container, b.min);

		// set canvas size (also clearing it); use double size on retina
		container.width = m * size.x;
		container.height = m * size.y;
		container.style.width = size.x + 'px';
		container.style.height = size.y + 'px';

		if (L.Browser.retina) {
			this._ctx.scale(2, 2);
		}

		// translate so we use the same path coordinates after canvas element moves
		this._ctx.translate(-b.min.x, -b.min.y);

		// Tell paths to redraw themselves
		this.fire('update');
	},

	_initPath: function (layer) {
		this._updateDashArray(layer);
		this._layers[L.stamp(layer)] = layer;
	},

	_addPath: L.Util.falseFn,

	_removePath: function (layer) {
		layer._removed = true;
		this._requestRedraw(layer);
	},

	_updatePath: function (layer) {
		this._redrawBounds = layer._pxBounds;
		this._draw(true);
		layer._project();
		layer._update();
		this._draw();
		this._redrawBounds = null;
	},

	_updateStyle: function (layer) {
		this._updateDashArray(layer);
		this._requestRedraw(layer);
	},

	_updateDashArray: function (layer) {
		if (layer.options.dashArray) {
			var parts = layer.options.dashArray.split(','),
			    dashArray = [],
			    i;
			for (i = 0; i < parts.length; i++) {
				dashArray.push(Number(parts[i]));
			}
			layer.options._dashArray = dashArray;
		}
	},

	_requestRedraw: function (layer) {
		if (!this._map) { return; }

		var padding = (layer.options.weight || 0) + 1;
		this._redrawBounds = this._redrawBounds || new L.Bounds();
		this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
		this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));

		this._redrawRequest = this._redrawRequest || L.Util.requestAnimFrame(this._redraw, this);
	},

	_redraw: function () {
		this._redrawRequest = null;

		this._draw(true); // clear layers in redraw bounds
		this._draw(); // draw layers

		this._redrawBounds = null;
	},

	_draw: function (clear) {
		this._clear = clear;
		var layer, bounds = this._redrawBounds;
		this._ctx.save();
		if (bounds) {
			this._ctx.beginPath();
			this._ctx.rect(bounds.min.x, bounds.min.y, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
			this._ctx.clip();
		}

		for (var id in this._layers) {
			layer = this._layers[id];
			if (!bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds))) {
				layer._updatePath();
			}
			if (clear && layer._removed) {
				delete layer._removed;
				delete this._layers[id];
			}
		}
		this._ctx.restore();  // Restore state before clipping.
	},

	_updatePoly: function (layer, closed) {

		var i, j, len2, p,
		    parts = layer._parts,
		    len = parts.length,
		    ctx = this._ctx;

		if (!len) { return; }

		this._drawnLayers[layer._leaflet_id] = layer;

		ctx.beginPath();

		if (ctx.setLineDash) {
			ctx.setLineDash(layer.options && layer.options._dashArray || []);
		}

		for (i = 0; i < len; i++) {
			for (j = 0, len2 = parts[i].length; j < len2; j++) {
				p = parts[i][j];
				ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
			}
			if (closed) {
				ctx.closePath();
			}
		}

		this._fillStroke(ctx, layer);

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_updateCircle: function (layer) {

		if (layer._empty()) { return; }

		var p = layer._point,
		    ctx = this._ctx,
		    r = layer._radius,
		    s = (layer._radiusY || r) / r;

		this._drawnLayers[layer._leaflet_id] = layer;

		if (s !== 1) {
			ctx.save();
			ctx.scale(1, s);
		}

		ctx.beginPath();
		ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

		if (s !== 1) {
			ctx.restore();
		}

		this._fillStroke(ctx, layer);
	},

	_fillStroke: function (ctx, layer) {
		var clear = this._clear,
		    options = layer.options;

		ctx.globalCompositeOperation = clear ? 'destination-out' : 'source-over';

		if (options.fill) {
			ctx.globalAlpha = clear ? 1 : options.fillOpacity;
			ctx.fillStyle = options.fillColor || options.color;
			ctx.fill(options.fillRule || 'evenodd');
		}

		if (options.stroke && options.weight !== 0) {
			ctx.globalAlpha = clear ? 1 : options.opacity;

			// if clearing shape, do it with the previously drawn line width
			layer._prevWeight = ctx.lineWidth = clear ? layer._prevWeight + 1 : options.weight;

			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	},

	// Canvas obviously doesn't have mouse events for individual drawn objects,
	// so we emulate that by calculating what's under the mouse on mousemove/click manually

	_onClick: function (e) {
		var point = this._map.mouseEventToLayerPoint(e), layers = [], layer;

		for (var id in this._layers) {
			layer = this._layers[id];
			if (layer.options.interactive && layer._containsPoint(point) && !this._map._draggableMoved(layer)) {
				L.DomEvent._fakeStop(e);
				layers.push(layer);
			}
		}
		if (layers.length)  {
			this._fireEvent(layers, e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) { return; }

		var point = this._map.mouseEventToLayerPoint(e);
		this._handleMouseOut(e, point);
		this._handleMouseHover(e, point);
	},


	_handleMouseOut: function (e, point) {
		var layer = this._hoveredLayer;
		if (layer && (e.type === 'mouseout' || !layer._containsPoint(point))) {
			// if we're leaving the layer, fire mouseout
			L.DomUtil.removeClass(this._container, 'leaflet-interactive');
			this._fireEvent([layer], e, 'mouseout');
			this._hoveredLayer = null;
		}
	},

	_handleMouseHover: function (e, point) {
		var id, layer;

		for (id in this._drawnLayers) {
			layer = this._drawnLayers[id];
			if (layer.options.interactive && layer._containsPoint(point)) {
				L.DomUtil.addClass(this._container, 'leaflet-interactive'); // change cursor
				this._fireEvent([layer], e, 'mouseover');
				this._hoveredLayer = layer;
			}
		}

		if (this._hoveredLayer) {
			this._fireEvent([this._hoveredLayer], e);
		}
	},

	_fireEvent: function (layers, e, type) {
		this._map._fireDOMEvent(e, type || e.type, layers);
	},

	// TODO _bringToFront & _bringToBack, pretty tricky

	_bringToFront: L.Util.falseFn,
	_bringToBack: L.Util.falseFn
});

// @namespace Browser; @property canvas: Boolean
// `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
L.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

// @namespace Canvas
// @factory L.canvas(options?: Renderer options)
// Creates a Canvas renderer with the given options.
L.canvas = function (options) {
	return L.Browser.canvas ? new L.Canvas(options) : null;
};

L.Polyline.prototype._containsPoint = function (p, closed) {
	var i, j, k, len, len2, part,
	    w = this._clickTolerance();

	if (!this._pxBounds.contains(p)) { return false; }

	// hit detection for polylines
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			if (!closed && (j === 0)) { continue; }

			if (L.LineUtil.pointToSegmentDistance(p, part[k], part[j]) <= w) {
				return true;
			}
		}
	}
	return false;
};

L.Polygon.prototype._containsPoint = function (p) {
	var inside = false,
	    part, p1, p2, i, j, k, len, len2;

	if (!this._pxBounds.contains(p)) { return false; }

	// ray casting algorithm for detecting if point is in polygon
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			p1 = part[j];
			p2 = part[k];

			if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
				inside = !inside;
			}
		}
	}

	// also check if it's on polygon stroke
	return inside || L.Polyline.prototype._containsPoint.call(this, p, true);
};

L.CircleMarker.prototype._containsPoint = function (p) {
	return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
};



/*
 * @class GeoJSON
 * @aka L.GeoJSON
 * @inherits FeatureGroup
 *
 * Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
 * GeoJSON data and display it on the map. Extends `FeatureGroup`.
 *
 * @example
 *
 * ```js
 * L.geoJSON(data, {
 * 	style: function (feature) {
 * 		return {color: feature.properties.color};
 * 	}
 * }).bindPopup(function (layer) {
 * 	return layer.feature.properties.description;
 * }).addTo(map);
 * ```
 */

L.GeoJSON = L.FeatureGroup.extend({

	/* @section
	 * @aka GeoJSON options
	 *
	 * @option pointToLayer: Function = *
	 * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
	 * called when data is added, passing the GeoJSON point feature and its `LatLng`.
	 * The default is to spawn a default `Marker`:
	 * ```js
	 * function(geoJsonPoint, latlng) {
	 * 	return L.marker(latlng);
	 * }
	 * ```
	 *
	 * @option style: Function = *
	 * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
	 * called internally when data is added.
	 * The default value is to not override any defaults:
	 * ```js
	 * function (geoJsonFeature) {
	 * 	return {}
	 * }
	 * ```
	 *
	 * @option onEachFeature: Function = *
	 * A `Function` that will be called once for each created `Feature`, after it has
	 * been created and styled. Useful for attaching events and popups to features.
	 * The default is to do nothing with the newly created layers:
	 * ```js
	 * function (feature, layer) {}
	 * ```
	 *
	 * @option filter: Function = *
	 * A `Function` that will be used to decide whether to include a feature or not.
	 * The default is to include all features:
	 * ```js
	 * function (geoJsonFeature) {
	 * 	return true;
	 * }
	 * ```
	 * Note: dynamically changing the `filter` option will have effect only on newly
	 * added data. It will _not_ re-evaluate already included features.
	 *
	 * @option coordsToLatLng: Function = *
	 * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
	 * The default is the `coordsToLatLng` static method.
	 */

	initialize: function (geojson, options) {
		L.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	// @method addData( <GeoJSON> data ): Layer
	// Adds a GeoJSON object to the layer.
	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// only add this if geometry or geometries are set and not null
				feature = features[i];
				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
					this.addData(feature);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return this; }

		var layer = L.GeoJSON.geometryToLayer(geojson, options);
		if (!layer) {
			return this;
		}
		layer.feature = L.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	// @method resetStyle( <Path> layer ): Layer
	// Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
	resetStyle: function (layer) {
		// reset any custom styles
		layer.options = L.Util.extend({}, layer.defaultOptions);
		this._setLayerStyle(layer, this.options.style);
		return this;
	},

	// @method setStyle( <Function> style ): Layer
	// Changes styles of GeoJSON vector layers with the given style function.
	setStyle: function (style) {
		return this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

// @section
// There are several static functions which can be called without instantiating L.GeoJSON:
L.extend(L.GeoJSON, {
	// @function geometryToLayer(featureData: Object, options?: GeoJSON options): Layer
	// Creates a `Layer` from a given GeoJSON feature. Can use a custom
	// [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
	// functions if provided as options.
	geometryToLayer: function (geojson, options) {

		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry ? geometry.coordinates : null,
		    layers = [],
		    pointToLayer = options && options.pointToLayer,
		    coordsToLatLng = options && options.coordsToLatLng || this.coordsToLatLng,
		    latlng, latlngs, i, len;

		if (!coords && !geometry) {
			return null;
		}

		switch (geometry.type) {
		case 'Point':
			latlng = coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = coordsToLatLng(coords[i]);
				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
			}
			return new L.FeatureGroup(layers);

		case 'LineString':
		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, geometry.type === 'LineString' ? 0 : 1, coordsToLatLng);
			return new L.Polyline(latlngs, options);

		case 'Polygon':
		case 'MultiPolygon':
			latlngs = this.coordsToLatLngs(coords, geometry.type === 'Polygon' ? 1 : 2, coordsToLatLng);
			return new L.Polygon(latlngs, options);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {
				var layer = this.geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, options);

				if (layer) {
					layers.push(layer);
				}
			}
			return new L.FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	// @function coordsToLatLng(coords: Array): LatLng
	// Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
	// or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.
	coordsToLatLng: function (coords) {
		return new L.LatLng(coords[1], coords[0], coords[2]);
	},

	// @function coordsToLatLngs(coords: Array, levelsDeep?: Number, coordsToLatLng?: Function): Array
	// Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
	// `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an array of arrays of points, etc., 0 by default).
	// Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.
	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) {
		var latlngs = [];

		for (var i = 0, len = coords.length, latlng; i < len; i++) {
			latlng = levelsDeep ?
			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	},

	// @function latLngToCoords(latlng: LatLng): Array
	// Reverse of [`coordsToLatLng`](#geojson-coordstolatlng)
	latLngToCoords: function (latlng) {
		return latlng.alt !== undefined ?
				[latlng.lng, latlng.lat, latlng.alt] :
				[latlng.lng, latlng.lat];
	},

	// @function latLngsToCoords(latlngs: Array, levelsDeep?: Number, closed?: Boolean): Array
	// Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs)
	// `closed` determines whether the first point should be appended to the end of the array to close the feature, only used when `levelsDeep` is 0. False by default.
	latLngsToCoords: function (latlngs, levelsDeep, closed) {
		var coords = [];

		for (var i = 0, len = latlngs.length; i < len; i++) {
			coords.push(levelsDeep ?
				L.GeoJSON.latLngsToCoords(latlngs[i], levelsDeep - 1, closed) :
				L.GeoJSON.latLngToCoords(latlngs[i]));
		}

		if (!levelsDeep && closed) {
			coords.push(coords[0]);
		}

		return coords;
	},

	getFeature: function (layer, newGeometry) {
		return layer.feature ?
				L.extend({}, layer.feature, {geometry: newGeometry}) :
				L.GeoJSON.asFeature(newGeometry);
	},

	// @function asFeature(geojson: Object): Object
	// Normalize GeoJSON geometries/features into GeoJSON features.
	asFeature: function (geojson) {
		if (geojson.type === 'Feature') {
			return geojson;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geojson
		};
	}
});

var PointToGeoJSON = {
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'Point',
			coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
		});
	}
};

// @namespace Marker
// @method toGeoJSON(): Object
// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the marker (as a GeoJSON `Point` Feature).
L.Marker.include(PointToGeoJSON);

// @namespace CircleMarker
// @method toGeoJSON(): Object
// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the circle marker (as a GeoJSON `Point` Feature).
L.Circle.include(PointToGeoJSON);
L.CircleMarker.include(PointToGeoJSON);


// @namespace Polyline
// @method toGeoJSON(): Object
// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polyline (as a GeoJSON `LineString` or `MultiLineString` Feature).
L.Polyline.prototype.toGeoJSON = function () {
	var multi = !L.Polyline._flat(this._latlngs);

	var coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 1 : 0);

	return L.GeoJSON.getFeature(this, {
		type: (multi ? 'Multi' : '') + 'LineString',
		coordinates: coords
	});
};

// @namespace Polygon
// @method toGeoJSON(): Object
// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polygon (as a GeoJSON `Polygon` or `MultiPolygon` Feature).
L.Polygon.prototype.toGeoJSON = function () {
	var holes = !L.Polyline._flat(this._latlngs),
	    multi = holes && !L.Polyline._flat(this._latlngs[0]);

	var coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true);

	if (!holes) {
		coords = [coords];
	}

	return L.GeoJSON.getFeature(this, {
		type: (multi ? 'Multi' : '') + 'Polygon',
		coordinates: coords
	});
};


// @namespace LayerGroup
L.LayerGroup.include({
	toMultiPoint: function () {
		var coords = [];

		this.eachLayer(function (layer) {
			coords.push(layer.toGeoJSON().geometry.coordinates);
		});

		return L.GeoJSON.getFeature(this, {
			type: 'MultiPoint',
			coordinates: coords
		});
	},

	// @method toGeoJSON(): Object
	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `GeometryCollection`).
	toGeoJSON: function () {

		var type = this.feature && this.feature.geometry && this.feature.geometry.type;

		if (type === 'MultiPoint') {
			return this.toMultiPoint();
		}

		var isGeometryCollection = type === 'GeometryCollection',
		    jsons = [];

		this.eachLayer(function (layer) {
			if (layer.toGeoJSON) {
				var json = layer.toGeoJSON();
				jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
			}
		});

		if (isGeometryCollection) {
			return L.GeoJSON.getFeature(this, {
				geometries: jsons,
				type: 'GeometryCollection'
			});
		}

		return {
			type: 'FeatureCollection',
			features: jsons
		};
	}
});

// @namespace GeoJSON
// @factory L.geoJSON(geojson?: Object, options?: GeoJSON options)
// Creates a GeoJSON layer. Optionally accepts an object in
// [GeoJSON format](http://geojson.org/geojson-spec.html) to display on the map
// (you can alternatively add it later with `addData` method) and an `options` object.
L.geoJSON = function (geojson, options) {
	return new L.GeoJSON(geojson, options);
};
// Backward compatibility.
L.geoJson = L.geoJSON;



/*
 * @class Draggable
 * @aka L.Draggable
 * @inherits Evented
 *
 * A class for making DOM elements draggable (including touch support).
 * Used internally for map and marker dragging. Only works for elements
 * that were positioned with [`L.DomUtil.setPosition`](#domutil-setposition).
 *
 * @example
 * ```js
 * var draggable = new L.Draggable(elementToDrag);
 * draggable.enable();
 * ```
 */

L.Draggable = L.Evented.extend({

	options: {
		// @option clickTolerance: Number = 3
		// The max number of pixels a user can shift the mouse pointer during a click
		// for it to be considered a valid click (as opposed to a mouse drag).
		clickTolerance: 3
	},

	statics: {
		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	// @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline: Boolean)
	// Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
	initialize: function (element, dragStartTarget, preventOutline) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
		this._preventOutline = preventOutline;
	},

	// @method enable()
	// Enables the dragging ability
	enable: function () {
		if (this._enabled) { return; }

		L.DomEvent.on(this._dragStartTarget, L.Draggable.START.join(' '), this._onDown, this);

		this._enabled = true;
	},

	// @method disable()
	// Disables the dragging ability
	disable: function () {
		if (!this._enabled) { return; }

		L.DomEvent.off(this._dragStartTarget, L.Draggable.START.join(' '), this._onDown, this);

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		// Ignore simulated events, since we handle both touch and
		// mouse explicitly; otherwise we risk getting duplicates of
		// touch events, see #4315.
		// Also ignore the event if disabled; this happens in IE11
		// under some circumstances, see #3666.
		if (e._simulated || !this._enabled) { return; }

		this._moved = false;

		if (L.DomUtil.hasClass(this._element, 'leaflet-zoom-anim')) { return; }

		if (L.Draggable._dragging || e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches) || !this._enabled) { return; }
		L.Draggable._dragging = true;  // Prevent dragging multiple objects at once.

		if (this._preventOutline) {
			L.DomUtil.preventOutline(this._element);
		}

		L.DomUtil.disableImageDrag();
		L.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		// @event down: Event
		// Fired when a drag is about to start.
		this.fire('down');

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new L.Point(first.clientX, first.clientY);

		L.DomEvent
			.on(document, L.Draggable.MOVE[e.type], this._onMove, this)
			.on(document, L.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		// Ignore simulated events, since we handle both touch and
		// mouse explicitly; otherwise we risk getting duplicates of
		// touch events, see #4315.
		// Also ignore the event if disabled; this happens in IE11
		// under some circumstances, see #3666.
		if (e._simulated || !this._enabled) { return; }

		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new L.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }
		if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) { return; }

		L.DomEvent.preventDefault(e);

		if (!this._moved) {
			// @event dragstart: Event
			// Fired when a drag starts
			this.fire('dragstart');

			this._moved = true;
			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

			L.DomUtil.addClass(document.body, 'leaflet-dragging');

			this._lastTarget = e.target || e.srcElement;
			// IE and Edge do not give the <use> element, so fetch it
			// if necessary
			if ((window.SVGElementInstance) && (this._lastTarget instanceof SVGElementInstance)) {
				this._lastTarget = this._lastTarget.correspondingUseElement;
			}
			L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		L.Util.cancelAnimFrame(this._animRequest);
		this._lastEvent = e;
		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true);
	},

	_updatePosition: function () {
		var e = {originalEvent: this._lastEvent};

		// @event predrag: Event
		// Fired continuously during dragging *before* each corresponding
		// update of the element's position.
		this.fire('predrag', e);
		L.DomUtil.setPosition(this._element, this._newPos);

		// @event drag: Event
		// Fired continuously during dragging.
		this.fire('drag', e);
	},

	_onUp: function (e) {
		// Ignore simulated events, since we handle both touch and
		// mouse explicitly; otherwise we risk getting duplicates of
		// touch events, see #4315.
		// Also ignore the event if disabled; this happens in IE11
		// under some circumstances, see #3666.
		if (e._simulated || !this._enabled) { return; }

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		if (this._lastTarget) {
			L.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');
			this._lastTarget = null;
		}

		for (var i in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[i], this._onMove, this)
				.off(document, L.Draggable.END[i], this._onUp, this);
		}

		L.DomUtil.enableImageDrag();
		L.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			L.Util.cancelAnimFrame(this._animRequest);

			// @event dragend: DragEndEvent
			// Fired when the drag ends.
			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
		L.Draggable._dragging = false;
	}
});



/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

// @class Handler
// @aka L.Handler
// Abstract class for map interaction handlers

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	// @method enable(): this
	// Enables the handler
	enable: function () {
		if (this._enabled) { return this; }

		this._enabled = true;
		this.addHooks();
		return this;
	},

	// @method disable(): this
	// Disables the handler
	disable: function () {
		if (!this._enabled) { return this; }

		this._enabled = false;
		this.removeHooks();
		return this;
	},

	// @method enabled(): Boolean
	// Returns `true` if the handler is enabled
	enabled: function () {
		return !!this._enabled;
	}

	// @section Extension methods
	// Classes inheriting from `Handler` must implement the two following methods:
	// @method addHooks()
	// Called when the handler is enabled, should add event hooks.
	// @method removeHooks()
	// Called when the handler is disabled, should remove the event hooks added previously.
});



/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

// @namespace Map
// @section Interaction Options
L.Map.mergeOptions({
	// @option dragging: Boolean = true
	// Whether the map be draggable with mouse/touch or not.
	dragging: true,

	// @section Panning Inertia Options
	// @option inertia: Boolean = *
	// If enabled, panning of the map will have an inertia effect where
	// the map builds momentum while dragging and continues moving in
	// the same direction for some time. Feels especially nice on touch
	// devices. Enabled by default unless running on old Android devices.
	inertia: !L.Browser.android23,

	// @option inertiaDeceleration: Number = 3000
	// The rate with which the inertial movement slows down, in pixels/second².
	inertiaDeceleration: 3400, // px/s^2

	// @option inertiaMaxSpeed: Number = Infinity
	// Max speed of the inertial movement, in pixels/second.
	inertiaMaxSpeed: Infinity, // px/s

	// @option easeLinearity: Number = 0.2
	easeLinearity: 0.2,

	// TODO refactor, move to CRS
	// @option worldCopyJump: Boolean = false
	// With this option enabled, the map tracks when you pan to another "copy"
	// of the world and seamlessly jumps to the original one so that all overlays
	// like markers and vector layers are still visible.
	worldCopyJump: false,

	// @option maxBoundsViscosity: Number = 0.0
	// If `maxBounds` is set, this option will control how solid the bounds
	// are when dragging the map around. The default value of `0.0` allows the
	// user to drag outside the bounds at normal speed, higher values will
	// slow down map dragging outside bounds, and `1.0` makes the bounds fully
	// solid, preventing the user from dragging outside the bounds.
	maxBoundsViscosity: 0.0
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				down: this._onDown,
				dragstart: this._onDragStart,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this);

			this._draggable.on('predrag', this._onPreDragLimit, this);
			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDragWrap, this);
				map.on('zoomend', this._onZoomEnd, this);

				map.whenReady(this._onZoomEnd, this);
			}
		}
		L.DomUtil.addClass(this._map._container, 'leaflet-grab leaflet-touch-drag');
		this._draggable.enable();
		this._positions = [];
		this._times = [];
	},

	removeHooks: function () {
		L.DomUtil.removeClass(this._map._container, 'leaflet-grab');
		L.DomUtil.removeClass(this._map._container, 'leaflet-touch-drag');
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	moving: function () {
		return this._draggable && this._draggable._moving;
	},

	_onDown: function () {
		this._map._stop();
	},

	_onDragStart: function () {
		var map = this._map;

		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
			var bounds = L.latLngBounds(this._map.options.maxBounds);

			this._offsetLimit = L.bounds(
				this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
				this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
					.add(this._map.getSize()));

			this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
		} else {
			this._offsetLimit = null;
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function (e) {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 50) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move', e)
		    .fire('drag', e);
	},

	_onZoomEnd: function () {
		var pxCenter = this._map.getSize().divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
	},

	_viscousLimit: function (value, threshold) {
		return value - (value - threshold) * this._viscosity;
	},

	_onPreDragLimit: function () {
		if (!this._viscosity || !this._offsetLimit) { return; }

		var offset = this._draggable._newPos.subtract(this._draggable._startPos);

		var limit = this._offsetLimit;
		if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
		if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
		if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
		if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

		this._draggable._newPos = this._draggable._startPos.add(offset);
	},

	_onPreDragWrap: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._absPos = this._draggable._newPos.clone();
		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,

		    noInertia = !options.inertia || this._times.length < 2;

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x && !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true,
						animate: true
					});
				});
			}
		}
	}
});

// @section Handlers
// @property dragging: Handler
// Map dragging handler (by both mouse and touch).
L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);



/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

// @namespace Map
// @section Interaction Options

L.Map.mergeOptions({
	// @option doubleClickZoom: Boolean|String = true
	// Whether the map can be zoomed in by double clicking on it and
	// zoomed out by double clicking while holding shift. If passed
	// `'center'`, double-click zoom will zoom to the center of the
	//  view regardless of where the mouse was.
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    oldZoom = map.getZoom(),
		    delta = map.options.zoomDelta,
		    zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

// @section Handlers
//
// Map properties include interaction handlers that allow you to control
// interaction behavior in runtime, enabling or disabling certain features such
// as dragging or touch zoom (see `Handler` methods). For example:
//
// ```js
// map.doubleClickZoom.disable();
// ```
//
// @property doubleClickZoom: Handler
// Double click zoom handler.
L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);



/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

// @namespace Map
// @section Interaction Options
L.Map.mergeOptions({
	// @section Mousewheel options
	// @option scrollWheelZoom: Boolean|String = true
	// Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
	// it will zoom to the center of the view regardless of where the mouse was.
	scrollWheelZoom: true,

	// @option wheelDebounceTime: Number = 40
	// Limits the rate at which a wheel can fire (in milliseconds). By default
	// user can't zoom via wheel more often than once per 40 ms.
	wheelDebounceTime: 40,

	// @option wheelPxPerZoomLevel: Number = 60
	// How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
	// mean a change of one full zoom level. Smaller values will make wheel-zooming
	// faster (and vice versa).
	wheelPxPerZoomLevel: 60
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);

		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll, this);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);

		var debounce = this._map.options.wheelDebounceTime;

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(debounce - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.stop(e);
	},

	_performZoom: function () {
		var map = this._map,
		    zoom = map.getZoom(),
		    snap = this._map.options.zoomSnap || 0;

		map._stop(); // stop panning and fly animations if any

		// map the delta with a sigmoid function to -4..4 range leaning on -1..1
		var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
		    d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
		    d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
		    delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

// @section Handlers
// @property scrollWheelZoom: Handler
// Scroll wheel zoom handler.
L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);



/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

L.extend(L.DomEvent, {

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last, touch,
		    doubleTap = false,
		    delay = 250;

		function onTouchStart(e) {
			var count;

			if (L.Browser.pointer) {
				count = L.DomEvent._pointersCount;
			} else {
				count = e.touches.length;
			}

			if (count > 1) { return; }

			var now = Date.now(),
			    delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd() {
			if (doubleTap && !touch.cancelBubble) {
				if (L.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = {},
					    prop, i;

					for (i in touch) {
						prop = touch[i];
						newTouch[i] = prop && prop.bind ? prop.bind(touch) : prop;
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}

		var pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend;

		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;
		obj[pre + 'dblclick' + id] = handler;

		obj.addEventListener(touchstart, onTouchStart, false);
		obj.addEventListener(touchend, onTouchEnd, false);

		// On some platforms (notably, chrome on win10 + touchscreen + mouse),
		// the browser doesn't fire touchend/pointerup events but does fire
		// native dblclicks. See #4127.
		if (!L.Browser.edge) {
			obj.addEventListener('dblclick', handler, false);
		}

		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_',
		    touchstart = obj[pre + this._touchstart + id],
		    touchend = obj[pre + this._touchend + id],
		    dblclick = obj[pre + 'dblclick' + id];

		obj.removeEventListener(this._touchstart, touchstart, false);
		obj.removeEventListener(this._touchend, touchend, false);
		if (!L.Browser.edge) {
			obj.removeEventListener('dblclick', dblclick, false);
		}

		return this;
	}
});



/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	POINTER_DOWN:   L.Browser.msPointer ? 'MSPointerDown'   : 'pointerdown',
	POINTER_MOVE:   L.Browser.msPointer ? 'MSPointerMove'   : 'pointermove',
	POINTER_UP:     L.Browser.msPointer ? 'MSPointerUp'     : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',
	TAG_WHITE_LIST: ['INPUT', 'SELECT', 'OPTION'],

	_pointers: {},
	_pointersCount: 0,

	// Provides a touch events wrapper for (ms)pointer events.
	// ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		if (type === 'touchstart') {
			this._addPointerStart(obj, handler, id);

		} else if (type === 'touchmove') {
			this._addPointerMove(obj, handler, id);

		} else if (type === 'touchend') {
			this._addPointerEnd(obj, handler, id);
		}

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var handler = obj['_leaflet_' + type + id];

		if (type === 'touchstart') {
			obj.removeEventListener(this.POINTER_DOWN, handler, false);

		} else if (type === 'touchmove') {
			obj.removeEventListener(this.POINTER_MOVE, handler, false);

		} else if (type === 'touchend') {
			obj.removeEventListener(this.POINTER_UP, handler, false);
			obj.removeEventListener(this.POINTER_CANCEL, handler, false);
		}

		return this;
	},

	_addPointerStart: function (obj, handler, id) {
		var onDown = L.bind(function (e) {
			if (e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
				// In IE11, some touch events needs to fire for form controls, or
				// the controls will stop working. We keep a whitelist of tag names that
				// need these events. For other target tags, we prevent default on the event.
				if (this.TAG_WHITE_LIST.indexOf(e.target.tagName) < 0) {
					L.DomEvent.preventDefault(e);
				} else {
					return;
				}
			}

			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchstart' + id] = onDown;
		obj.addEventListener(this.POINTER_DOWN, onDown, false);

		// need to keep track of what pointers and how many are active to provide e.touches emulation
		if (!this._pointerDocListener) {
			var pointerUp = L.bind(this._globalPointerUp, this);

			// we listen documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_DOWN, L.bind(this._globalPointerDown, this), true);
			document.documentElement.addEventListener(this.POINTER_MOVE, L.bind(this._globalPointerMove, this), true);
			document.documentElement.addEventListener(this.POINTER_UP, pointerUp, true);
			document.documentElement.addEventListener(this.POINTER_CANCEL, pointerUp, true);

			this._pointerDocListener = true;
		}
	},

	_globalPointerDown: function (e) {
		this._pointers[e.pointerId] = e;
		this._pointersCount++;
	},

	_globalPointerMove: function (e) {
		if (this._pointers[e.pointerId]) {
			this._pointers[e.pointerId] = e;
		}
	},

	_globalPointerUp: function (e) {
		delete this._pointers[e.pointerId];
		this._pointersCount--;
	},

	_handlePointer: function (e, handler) {
		e.touches = [];
		for (var i in this._pointers) {
			e.touches.push(this._pointers[i]);
		}
		e.changedTouches = [e];

		handler(e);
	},

	_addPointerMove: function (obj, handler, id) {
		var onMove = L.bind(function (e) {
			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchmove' + id] = onMove;
		obj.addEventListener(this.POINTER_MOVE, onMove, false);
	},

	_addPointerEnd: function (obj, handler, id) {
		var onUp = L.bind(function (e) {
			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchend' + id] = onUp;
		obj.addEventListener(this.POINTER_UP, onUp, false);
		obj.addEventListener(this.POINTER_CANCEL, onUp, false);
	}
});



/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

// @namespace Map
// @section Interaction Options
L.Map.mergeOptions({
	// @section Touch interaction options
	// @option touchZoom: Boolean|String = *
	// Whether the map can be zoomed by touch-dragging with two fingers. If
	// passed `'center'`, it will zoom to the center of the view regardless of
	// where the touch events (fingers) were. Enabled for touch-capable web
	// browsers except for old Androids.
	touchZoom: L.Browser.touch && !L.Browser.android23,

	// @option bounceAtZoomLimits: Boolean = true
	// Set it to false if you don't want the map to zoom beyond min/max zoom
	// and then bounce back when pinch-zooming.
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
	addHooks: function () {
		L.DomUtil.addClass(this._map._container, 'leaflet-touch-zoom');
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomUtil.removeClass(this._map._container, 'leaflet-touch-zoom');
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;
		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToContainerPoint(e.touches[0]),
		    p2 = map.mouseEventToContainerPoint(e.touches[1]);

		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.touchZoom !== 'center') {
			this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
		}

		this._startDist = p1.distanceTo(p2);
		this._startZoom = map.getZoom();

		this._moved = false;
		this._zooming = true;

		map._stop();

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var map = this._map,
		    p1 = map.mouseEventToContainerPoint(e.touches[0]),
		    p2 = map.mouseEventToContainerPoint(e.touches[1]),
		    scale = p1.distanceTo(p2) / this._startDist;


		this._zoom = map.getScaleZoom(scale, this._startZoom);

		if (!map.options.bounceAtZoomLimits && (
			(this._zoom < map.getMinZoom() && scale < 1) ||
			(this._zoom > map.getMaxZoom() && scale > 1))) {
			this._zoom = map._limitZoom(this._zoom);
		}

		if (map.options.touchZoom === 'center') {
			this._center = this._startLatLng;
			if (scale === 1) { return; }
		} else {
			// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
			var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
			if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
		}

		if (!this._moved) {
			map._moveStart(true);
			this._moved = true;
		}

		L.Util.cancelAnimFrame(this._animRequest);

		var moveFn = L.bind(map._move, map, this._center, this._zoom, {pinch: true, round: false});
		this._animRequest = L.Util.requestAnimFrame(moveFn, this, true);

		L.DomEvent.preventDefault(e);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		this._zooming = false;
		L.Util.cancelAnimFrame(this._animRequest);

		L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		// Pinch updates GridLayers' levels only when zoomSnap is off, so zoomSnap becomes noUpdate.
		if (this._map.options.zoomAnimation) {
			this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
		} else {
			this._map._resetView(this._center, this._map._limitZoom(this._zoom));
		}
	}
});

// @section Handlers
// @property touchZoom: Handler
// Touch zoom handler.
L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);



/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

// @namespace Map
// @section Interaction Options
L.Map.mergeOptions({
	// @section Touch interaction options
	// @option tap: Boolean = true
	// Enables mobile hacks for supporting instant taps (fixing 200ms click
	// delay on iOS/Android) and touch holds (fired as `contextmenu` events).
	tap: true,

	// @option tapTolerance: Number = 15
	// The max number of pixels a user can shift his finger during touch
	// for it to be considered a valid tap.
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		this._simulateEvent('mousedown', first);

		L.DomEvent.on(document, {
			touchmove: this._onMove,
			touchend: this._onUp
		}, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent.off(document, {
			touchmove: this._onMove,
			touchend: this._onUp
		}, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			this._simulateEvent('mouseup', first);

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
		this._simulateEvent('mousemove', first);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

// @section Handlers
// @property tap: Handler
// Mobile touch hacks (quick tap and touch hold) handler.
if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}



/*
 * L.Handler.BoxZoom is used to add shift-drag zoom interaction to the map
 * (zoom to a selected bounding box), enabled by default.
 */

// @namespace Map
// @section Interaction Options
L.Map.mergeOptions({
	// @option boxZoom: Boolean = true
	// Whether the map can be zoomed to a rectangular area specified by
	// dragging the mouse while pressing the shift key.
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown, this);
	},

	moved: function () {
		return this._moved;
	},

	_resetState: function () {
		this._moved = false;
	},

	_onMouseDown: function (e) {
		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		this._resetState();

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		L.DomEvent.on(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._moved = true;

			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._container);
			L.DomUtil.addClass(this._container, 'leaflet-crosshair');

			this._map.fire('boxzoomstart');
		}

		this._point = this._map.mouseEventToContainerPoint(e);

		var bounds = new L.Bounds(this._point, this._startPoint),
		    size = bounds.getSize();

		L.DomUtil.setPosition(this._box, bounds.min);

		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	_finish: function () {
		if (this._moved) {
			L.DomUtil.remove(this._box);
			L.DomUtil.removeClass(this._container, 'leaflet-crosshair');
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent.off(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseUp: function (e) {
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();

		if (!this._moved) { return; }
		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		setTimeout(L.bind(this._resetState, this), 0);

		var bounds = new L.LatLngBounds(
		        this._map.containerPointToLatLng(this._startPoint),
		        this._map.containerPointToLatLng(this._point));

		this._map
			.fitBounds(bounds)
			.fire('boxzoomend', {boxZoomBounds: bounds});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

// @section Handlers
// @property boxZoom: Handler
// Box (shift-drag with mouse) zoom handler.
L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);



/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

// @namespace Map
// @section Keyboard Navigation Options
L.Map.mergeOptions({
	// @option keyboard: Boolean = true
	// Makes the map focusable and allows users to navigate the map with keyboard
	// arrows and `+`/`-` keys.
	keyboard: true,

	// @option keyboardPanDelta: Number = 80
	// Amount of pixels to pan when pressing an arrow key.
	keyboardPanDelta: 80
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 54, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanDelta(map.options.keyboardPanDelta);
		this._setZoomDelta(map.options.zoomDelta);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex <= 0) {
			container.tabIndex = '0';
		}

		L.DomEvent.on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			mousedown: this._onMouseDown
		}, this);

		this._map.on({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	removeHooks: function () {
		this._removeHooks();

		L.DomEvent.off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			mousedown: this._onMouseDown
		}, this);

		this._map.off({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanDelta: function (panDelta) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * panDelta, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [panDelta, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, panDelta];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * panDelta];
		}
	},

	_setZoomDelta: function (zoomDelta) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoomDelta;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoomDelta;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

		var key = e.keyCode,
		    map = this._map,
		    offset;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			offset = this._panKeys[key];
			if (e.shiftKey) {
				offset = L.point(offset).multiplyBy(3);
			}

			map.panBy(offset);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

		} else if (key === 27) {
			map.closePopup();

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

// @section Handlers
// @section Handlers
// @property keyboard: Handler
// Keyboard navigation handler.
L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);



/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */


/* @namespace Marker
 * @section Interaction handlers
 *
 * Interaction handlers are properties of a marker instance that allow you to control interaction behavior in runtime, enabling or disabling certain features such as dragging (see `Handler` methods). Example:
 *
 * ```js
 * marker.dragging.disable();
 * ```
 *
 * @property dragging: Handler
 * Marker dragging handler (by both mouse and touch).
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;

		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon, true);
		}

		this._draggable.on({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();

		L.DomUtil.addClass(icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable.off({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();

		if (this._marker._icon) {
			L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
		}
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		// @section Dragging events
		// @event dragstart: Event
		// Fired when the user starts dragging the marker.

		// @event movestart: Event
		// Fired when the marker starts moving (because of dragging).

		this._oldLatLng = this._marker.getLatLng();
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function (e) {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;
		e.latlng = latlng;
		e.oldLatLng = this._oldLatLng;

		// @event drag: Event
		// Fired repeatedly while the user drags the marker.
		marker
		    .fire('move', e)
		    .fire('drag', e);
	},

	_onDragEnd: function (e) {
		// @event dragend: DragEndEvent
		// Fired when the user stops dragging the marker.

		// @event moveend: Event
		// Fired when the marker stops moving (because of dragging).
		delete this._oldLatLng;
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});



/*
 * @class Control
 * @aka L.Control
 *
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

L.Control = L.Class.extend({
	// @section
	// @aka Control options
	options: {
		// @option position: String = 'topright'
		// The position of the control (one of the map corners). Possible values are `'topleft'`,
		// `'topright'`, `'bottomleft'` or `'bottomright'`
		position: 'topright'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	/* @section
	 * Classes extending L.Control will inherit the following methods:
	 *
	 * @method getPosition: string
	 * Returns the position of the control.
	 */
	getPosition: function () {
		return this.options.position;
	},

	// @method setPosition(position: string): this
	// Sets the position of the control.
	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	// @method getContainer: HTMLElement
	// Returns the HTMLElement that contains the control.
	getContainer: function () {
		return this._container;
	},

	// @method addTo(map: Map): this
	// Adds the control to the given map.
	addTo: function (map) {
		this.remove();
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	// @method remove: this
	// Removes the control from the map it is currently active on.
	remove: function () {
		if (!this._map) {
			return this;
		}

		L.DomUtil.remove(this._container);

		if (this.onRemove) {
			this.onRemove(this._map);
		}

		this._map = null;

		return this;
	},

	_refocusOnMap: function (e) {
		// if map exists and event is not a keyboard event
		if (this._map && e && e.screenX > 0 && e.screenY > 0) {
			this._map.getContainer().focus();
		}
	}
});

L.control = function (options) {
	return new L.Control(options);
};

/* @section Extension methods
 * @uninheritable
 *
 * Every control should extend from `L.Control` and (re-)implement the following methods.
 *
 * @method onAdd(map: Map): HTMLElement
 * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
 *
 * @method onRemove(map: Map)
 * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
 */

/* @namespace Map
 * @section Methods for Layers and Controls
 */
L.Map.include({
	// @method addControl(control: Control): this
	// Adds the given control to the map
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	// @method removeControl(control: Control): this
	// Removes the given control from the map
	removeControl: function (control) {
		control.remove();
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		L.DomUtil.remove(this._controlContainer);
	}
});



/*
 * @class Control.Zoom
 * @aka L.Control.Zoom
 * @inherits Control
 *
 * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
 */

L.Control.Zoom = L.Control.extend({
	// @section
	// @aka Control.Zoom options
	options: {
		position: 'topleft',

		// @option zoomInText: String = '+'
		// The text set on the 'zoom in' button.
		zoomInText: '+',

		// @option zoomInTitle: String = 'Zoom in'
		// The title set on the 'zoom in' button.
		zoomInTitle: 'Zoom in',

		// @option zoomOutText: String = '-'
		// The text set on the 'zoom out' button.
		zoomOutText: '-',

		// @option zoomOutTitle: String = 'Zoom out'
		// The title set on the 'zoom out' button.
		zoomOutTitle: 'Zoom out'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar'),
		    options = this.options;

		this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn);
		this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	disable: function () {
		this._disabled = true;
		this._updateDisabled();
		return this;
	},

	enable: function () {
		this._disabled = false;
		this._updateDisabled();
		return this;
	},

	_zoomIn: function (e) {
		if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
			this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	},

	_zoomOut: function (e) {
		if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
			this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	},

	_createButton: function (html, title, className, container, fn) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent
		    .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
		    .on(link, 'click', L.DomEvent.stop)
		    .on(link, 'click', fn, this)
		    .on(link, 'click', this._refocusOnMap, this);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
		    className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (this._disabled || map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (this._disabled || map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

// @namespace Map
// @section Control options
// @option zoomControl: Boolean = true
// Whether a [zoom control](#control-zoom) is added to the map by default.
L.Map.mergeOptions({
	zoomControl: true
});

L.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new L.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

// @namespace Control.Zoom
// @factory L.control.zoom(options: Control.Zoom options)
// Creates a zoom control
L.control.zoom = function (options) {
	return new L.Control.Zoom(options);
};



/*
 * @class Control.Attribution
 * @aka L.Control.Attribution
 * @inherits Control
 *
 * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
 */

L.Control.Attribution = L.Control.extend({
	// @section
	// @aka Control.Attribution options
	options: {
		position: 'bottomright',

		// @option prefix: String = 'Leaflet'
		// The HTML text shown before the attributions. Pass `false` to disable.
		prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		map.attributionControl = this;
		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
		if (L.DomEvent) {
			L.DomEvent.disableClickPropagation(this._container);
		}

		// TODO ugly, refactor
		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}

		this._update();

		return this._container;
	},

	// @method setPrefix(prefix: String): this
	// Sets the text before the attributions.
	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	// @method addAttribution(text: String): this
	// Adds an attribution text (e.g. `'Vector data &copy; Mapbox'`).
	addAttribution: function (text) {
		if (!text) { return this; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	// @method removeAttribution(text: String): this
	// Removes an attribution text.
	removeAttribution: function (text) {
		if (!text) { return this; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	}
});

// @namespace Map
// @section Control options
// @option attributionControl: Boolean = true
// Whether a [attribution control](#control-attribution) is added to the map by default.
L.Map.mergeOptions({
	attributionControl: true
});

L.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		new L.Control.Attribution().addTo(this);
	}
});

// @namespace Control.Attribution
// @factory L.control.attribution(options: Control.Attribution options)
// Creates an attribution control.
L.control.attribution = function (options) {
	return new L.Control.Attribution(options);
};



/*
 * @class Control.Scale
 * @aka L.Control.Scale
 * @inherits Control
 *
 * A simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems. Extends `Control`.
 *
 * @example
 *
 * ```js
 * L.control.scale().addTo(map);
 * ```
 */

L.Control.Scale = L.Control.extend({
	// @section
	// @aka Control.Scale options
	options: {
		position: 'bottomleft',

		// @option maxWidth: Number = 100
		// Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
		maxWidth: 100,

		// @option metric: Boolean = True
		// Whether to show the metric scale line (m/km).
		metric: true,

		// @option imperial: Boolean = True
		// Whether to show the imperial scale line (mi/ft).
		imperial: true

		// @option updateWhenIdle: Boolean = false
		// If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).
	},

	onAdd: function (map) {
		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className + '-line', container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className, container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className, container);
		}
	},

	_update: function () {
		var map = this._map,
		    y = map.getSize().y / 2;

		var maxMeters = map.distance(
				map.containerPointToLatLng([0, y]),
				map.containerPointToLatLng([this.options.maxWidth, y]));

		this._updateScales(maxMeters);
	},

	_updateScales: function (maxMeters) {
		if (this.options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}
		if (this.options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters),
		    label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

		this._updateScale(this._mScale, label, meters / maxMeters);
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);
			this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);

		} else {
			feet = this._getRoundNum(maxFeet);
			this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
		}
	},

	_updateScale: function (scale, text, ratio) {
		scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
		scale.innerHTML = text;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 :
		    d >= 5 ? 5 :
		    d >= 3 ? 3 :
		    d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});


// @factory L.control.scale(options?: Control.Scale options)
// Creates an scale control with the given options.
L.control.scale = function (options) {
	return new L.Control.Scale(options);
};



/*
 * @class Control.Layers
 * @aka L.Control.Layers
 * @inherits Control
 *
 * The layers control gives users the ability to switch between different base layers and switch overlays on/off (check out the [detailed example](http://leafletjs.com/examples/layers-control.html)). Extends `Control`.
 *
 * @example
 *
 * ```js
 * var baseLayers = {
 * 	"Mapbox": mapbox,
 * 	"OpenStreetMap": osm
 * };
 *
 * var overlays = {
 * 	"Marker": marker,
 * 	"Roads": roadsLayer
 * };
 *
 * L.control.layers(baseLayers, overlays).addTo(map);
 * ```
 *
 * The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
 *
 * ```js
 * {
 *     "<someName1>": layer1,
 *     "<someName2>": layer2
 * }
 * ```
 *
 * The layer names can contain HTML, which allows you to add additional styling to the items:
 *
 * ```js
 * {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
 * ```
 */


L.Control.Layers = L.Control.extend({
	// @section
	// @aka Control.Layers options
	options: {
		// @option collapsed: Boolean = true
		// If `true`, the control will be collapsed into an icon and expanded on mouse hover or touch.
		collapsed: true,
		position: 'topright',

		// @option autoZIndex: Boolean = true
		// If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
		autoZIndex: true,

		// @option hideSingleBase: Boolean = false
		// If `true`, the base layers in the control will be hidden when there is only one.
		hideSingleBase: false
	},

	initialize: function (baseLayers, overlays, options) {
		L.setOptions(this, options);

		this._layers = [];
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		this._map = map;
		map.on('zoomend', this._checkDisabledLayers, this);

		return this._container;
	},

	onRemove: function () {
		this._map.off('zoomend', this._checkDisabledLayers, this);

		for (var i = 0; i < this._layers.length; i++) {
			this._layers[i].layer.off('add remove', this._onLayerChange, this);
		}
	},

	// @method addBaseLayer(layer: Layer, name: String): this
	// Adds a base layer (radio button entry) with the given name to the control.
	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		return (this._map) ? this._update() : this;
	},

	// @method addOverlay(layer: Layer, name: String): this
	// Adds an overlay (checkbox entry) with the given name to the control.
	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		return (this._map) ? this._update() : this;
	},

	// @method removeLayer(layer: Layer): this
	// Remove the given layer from the control.
	removeLayer: function (layer) {
		layer.off('add remove', this._onLayerChange, this);

		var obj = this._getLayer(L.stamp(layer));
		if (obj) {
			this._layers.splice(this._layers.indexOf(obj), 1);
		}
		return (this._map) ? this._update() : this;
	},

	// @method expand(): this
	// Expand the control container if collapsed.
	expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
		this._form.style.height = null;
		var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._form.clientHeight) {
			L.DomUtil.addClass(this._form, 'leaflet-control-layers-scrollbar');
			this._form.style.height = acceptableHeight + 'px';
		} else {
			L.DomUtil.removeClass(this._form, 'leaflet-control-layers-scrollbar');
		}
		this._checkDisabledLayers();
		return this;
	},

	// @method collapse(): this
	// Collapse the control container if expanded.
	collapse: function () {
		L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
		return this;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		// makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		L.DomEvent.disableClickPropagation(container);
		if (!L.Browser.touch) {
			L.DomEvent.disableScrollPropagation(container);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent.on(container, {
					mouseenter: this.expand,
					mouseleave: this.collapse
				}, this);
			}

			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this.expand, this);
			} else {
				L.DomEvent.on(link, 'focus', this.expand, this);
			}

			// work around for Firefox Android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this.collapse, this);
			// TODO keyboard accessibility
		} else {
			this.expand();
		}

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_getLayer: function (id) {
		for (var i = 0; i < this._layers.length; i++) {

			if (this._layers[i] && L.stamp(this._layers[i].layer) === id) {
				return this._layers[i];
			}
		}
	},

	_addLayer: function (layer, name, overlay) {
		layer.on('add remove', this._onLayerChange, this);

		this._layers.push({
			layer: layer,
			name: name,
			overlay: overlay
		});

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) { return this; }

		L.DomUtil.empty(this._baseLayersList);
		L.DomUtil.empty(this._overlaysList);

		var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

		for (i = 0; i < this._layers.length; i++) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
			baseLayersCount += !obj.overlay ? 1 : 0;
		}

		// Hide base layers section if there's only one layer.
		if (this.options.hideSingleBase) {
			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
			this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

		return this;
	},

	_onLayerChange: function (e) {
		if (!this._handlingClick) {
			this._update();
		}

		var obj = this._getLayer(L.stamp(e.target));

		// @namespace Map
		// @section Layer events
		// @event baselayerchange: LayersControlEvent
		// Fired when the base layer is changed through the [layer control](#control-layers).
		// @event overlayadd: LayersControlEvent
		// Fired when an overlay is selected through the [layer control](#control-layers).
		// @event overlayremove: LayersControlEvent
		// Fired when an overlay is deselected through the [layer control](#control-layers).
		// @namespace Control.Layers
		var type = obj.overlay ?
			(e.type === 'add' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'add' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' +
				name + '"' + (checked ? ' checked="checked"' : '') + '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    checked = this._map.hasLayer(obj.layer),
		    input;

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = L.stamp(obj.layer);

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		// Helps from preventing layer control flicker when checkboxes are disabled
		// https://github.com/Leaflet/Leaflet/issues/2771
		var holder = document.createElement('div');

		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		this._checkDisabledLayers();
		return label;
	},

	_onInputClick: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    input, layer, hasLayer;
		var addedLayers = [],
		    removedLayers = [];

		this._handlingClick = true;

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			layer = this._getLayer(input.layerId).layer;
			hasLayer = this._map.hasLayer(layer);

			if (input.checked && !hasLayer) {
				addedLayers.push(layer);

			} else if (!input.checked && hasLayer) {
				removedLayers.push(layer);
			}
		}

		// Bugfix issue 2318: Should remove all old layers before readding new ones
		for (i = 0; i < removedLayers.length; i++) {
			this._map.removeLayer(removedLayers[i]);
		}
		for (i = 0; i < addedLayers.length; i++) {
			this._map.addLayer(addedLayers[i]);
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_checkDisabledLayers: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    input,
		    layer,
		    zoom = this._map.getZoom();

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			layer = this._getLayer(input.layerId).layer;
			input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
			                 (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);

		}
	},

	_expand: function () {
		// Backward compatibility, remove me in 1.1.
		return this.expand();
	},

	_collapse: function () {
		// Backward compatibility, remove me in 1.1.
		return this.collapse();
	}

});


// @factory L.control.layers(baselayers?: Object, overlays?: Object, options?: Control.Layers options)
// Creates an attribution control with the given layers. Base layers will be switched with radio buttons, while overlays will be switched with checkboxes. Note that all base layers should be passed in the base layers object, but only one should be added to the map during map instantiation.
L.control.layers = function (baseLayers, overlays, options) {
	return new L.Control.Layers(baseLayers, overlays, options);
};



}(window, document));
//# sourceMappingURL=leaflet-src.map
/*
Geodesic extension to Leaflet library, by Fragger
https://github.com/Fragger/Leaflet.Geodesic
Version from master branch, dated Apr 26, 2013
Modified by qnstie 2013-07-17 to maintain compatibility with Leaflet.draw
*/
(function () {
  function geodesicPoly(Klass, fill) {
    return Klass.extend({
      initialize: function (latlngs, options) {
        Klass.prototype.initialize.call(this, L.geodesicConvertLines(latlngs, fill), options);
        this._latlngsinit = this._convertLatLngs(latlngs);
      },
      getLatLngs: function () {
        return this._latlngsinit;
      },
      setLatLngs: function (latlngs) {
        this._latlngsinit = this._convertLatLngs(latlngs);
        return this.redraw();
      },
      addLatLng: function (latlng) {
        this._latlngsinit.push(L.latLng(latlng));
        return this.redraw();
      },
      spliceLatLngs: function () { // (Number index, Number howMany)
        var removed = [].splice.apply(this._latlngsinit, arguments);
        this._convertLatLngs(this._latlngsinit);
        this.redraw();
        return removed;
      },
      redraw: function() {
        this._latlngs = this._convertLatLngs(L.geodesicConvertLines(this._latlngsinit, fill));
        return Klass.prototype.redraw.call(this);
      }
    });
  }

  // alternative geodesic line intermediate points function
  // as north/south lines have very little curvature in the projection, we cam use longitude (east/west) seperation
  // to calculate intermediate points. hopeefully this will avoid the rounding issues seen in the full intermediate
  // points code that have been seen
  function geodesicConvertLine(startLatLng, endLatLng, convertedPoints) {
    var R = 6367000.0; // earth radius in meters (doesn't have to be exact)
    var d2r = Math.PI/180.0;
    var r2d = 180.0/Math.PI;

    // maths based on http://williams.best.vwh.net/avform.htm#Int

    var lat1 = startLatLng.lat * d2r;
    var lat2 = endLatLng.lat * d2r;
    var lng1 = startLatLng.lng * d2r;
    var lng2 = endLatLng.lng * d2r;

    var dLng = lng2-lng1;

    var segments = Math.floor(Math.abs(dLng * R / 5000));

    if (segments > 1) {
      // pre-calculate some constant values for the loop
      var sinLat1 = Math.sin(lat1);
      var sinLat2 = Math.sin(lat2);
      var cosLat1 = Math.cos(lat1);
      var cosLat2 = Math.cos(lat2);

      var sinLat1CosLat2 = sinLat1*cosLat2;
      var sinLat2CosLat1 = sinLat2*cosLat1;

      var cosLat1CosLat2SinDLng = cosLat1*cosLat2*Math.sin(dLng);

      for (var i=1; i < segments; i++) {
        var iLng = lng1+dLng*(i/segments);
        var iLat = Math.atan( (sinLat1CosLat2*Math.sin(lng2-iLng) + sinLat2CosLat1*Math.sin(iLng-lng1))
                              / cosLat1CosLat2SinDLng)

        var point = L.latLng ( [iLat*r2d, iLng*r2d] );
        convertedPoints.push(point);
      }
    }

    convertedPoints.push(L.latLng(endLatLng));
  }



  L.geodesicConvertLines = function (latlngs, fill) {
    if (latlngs.length == 0) {
      return [];
    }

    for (var i = 0, len = latlngs.length; i < len; i++) {
      if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
        return;
      }
      latlngs[i] = L.latLng(latlngs[i]);
    }

    // geodesic calculations have issues when crossing the anti-meridian. so offset the points
    // so this isn't an issue, then add back the offset afterwards
    // a center longitude would be ideal - but the start point longitude will be 'good enough'
    var lngOffset = latlngs[0].lng;

    // points are wrapped after being offset relative to the first point coordinate, so they're
    // within +-180 degrees
    latlngs = latlngs.map(function(a){ return L.latLng(a.lat, a.lng-lngOffset).wrap(); });

    var geodesiclatlngs = [];

    if(!fill) {
      geodesiclatlngs.push(latlngs[0]);
    }
    for (i = 0, len = latlngs.length - 1; i < len; i++) {
      geodesicConvertLine(latlngs[i], latlngs[i+1], geodesiclatlngs);
    }
    if(fill) {
      geodesicConvertLine(latlngs[len], latlngs[0], geodesiclatlngs);
    }

    // now add back the offset subtracted above. no wrapping here - the drawing code handles
    // things better when there's no sudden jumps in coordinates. yes, lines will extend
    // beyond +-180 degrees - but they won't be 'broken'
    geodesiclatlngs = geodesiclatlngs.map(function(a){ return L.latLng(a.lat, a.lng+lngOffset); });

    return geodesiclatlngs;
  }
  
  L.GeodesicPolyline = geodesicPoly(L.Polyline, 0);
  L.GeodesicPolygon = geodesicPoly(L.Polygon, 1);

  //L.GeodesicMultiPolyline = createMulti(L.GeodesicPolyline);
  //L.GeodesicMultiPolygon = createMulti(L.GeodesicPolygon);

  /*L.GeodesicMultiPolyline = L.MultiPolyline.extend({
    initialize: function (latlngs, options) {
      L.MultiPolyline.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/

  /*L.GeodesicMultiPolygon = L.MultiPolygon.extend({
    initialize: function (latlngs, options) {
      L.MultiPolygon.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/


  L.GeodesicCircle = L.Polygon.extend({
    initialize: function (latlng, radius, options) {
      this._latlng = L.latLng(latlng);
      this._mRadius = radius;

      points = this._calcPoints();

      L.Polygon.prototype.initialize.call(this, points, options);
    },

    options: {
      fill: true
    },

    setLatLng: function (latlng) {
      this._latlng = L.latLng(latlng);
      points = this._calcPoints();
      this.setLatLngs(points);
    },

    setRadius: function (radius) {
      this._mRadius = radius;
      points = this._calcPoints();
      this.setLatLngs(points);

    },

    getLatLng: function () {
      return this._latlng;
    },

    getRadius: function() {
      return this._mRadius;
    },


    _calcPoints: function() {
      var R = 6367000.0; //earth radius in meters (approx - taken from leaflet source code)
      var d2r = Math.PI/180.0;
      var r2d = 180.0/Math.PI;
//console.log("geodesicCircle: radius = "+this._mRadius+"m, centre "+this._latlng.lat+","+this._latlng.lng);

      // circle radius as an angle from the centre of the earth
      var radRadius = this._mRadius / R;

//console.log(" (radius in radians "+radRadius);

      // pre-calculate various values used for every point on the circle
      var centreLat = this._latlng.lat * d2r;
      var centreLng = this._latlng.lng * d2r;

      var cosCentreLat = Math.cos(centreLat);
      var sinCentreLat = Math.sin(centreLat);

      var cosRadRadius = Math.cos(radRadius);
      var sinRadRadius = Math.sin(radRadius);

      var calcLatLngAtAngle = function(angle) {
        var lat = Math.asin(sinCentreLat*cosRadRadius + cosCentreLat*sinRadRadius*Math.cos(angle));
        var lng = centreLng + Math.atan2(Math.sin(angle)*sinRadRadius*cosCentreLat, cosRadRadius-sinCentreLat*Math.sin(lat));

        return L.latLng(lat * r2d,lng * r2d);
      }


      var segments = Math.max(48,Math.floor(this._mRadius/1000));
//console.log(" (drawing circle as "+segments+" lines)");
      var points = [];
      for (var i=0; i<segments; i++) {
        var angle = Math.PI*2/segments*i;

        var point = calcLatLngAtAngle(angle)
        points.push ( point );
      }

      return points;
    },

  });


  L.geodesicPolyline = function (latlngs, options) {
    return new L.GeodesicPolyline(latlngs, options);
  };

  L.geodesicPolygon = function (latlngs, options) {
    return new L.GeodesicPolygon(latlngs, options);
  };
  
  /*
  L.geodesicMultiPolyline = function (latlngs, options) {
    return new L.GeodesicMultiPolyline(latlngs, options);
  };

  L.geodesicMultiPolygon = function (latlngs, options) {
    return new L.GeodesicMultiPolygon(latlngs, options);
  };

  */

  L.geodesicCircle = function (latlng, radius, options) {
    return new L.GeodesicCircle(latlng, radius, options);
  }

}());

// modified version of https://github.com/shramov/leaflet-plugins. Also
// contains the default Ingress map style.
/*
 * Google layer using Google Maps API
 */
//(function (google, L) {

L.Google = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		opacity: 1,
		continuousWorld: false,
		noWrap: false,
		mapOptions: {
			backgroundColor: '#dddddd'
		}
	},

	// Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._ready = google.maps.Map != undefined;
		if (!this._ready) L.Google.asyncWait.push(this);

		this._type = type || 'SATELLITE';
	},

	onAdd: function(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._resetCallback, this);

		this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
		map.on('move', this._update, this);

		map.on('zoomanim', this._handleZoomAnim, this);

		//20px instead of 1em to avoid a slight overlap with google's attribution
		map._controlCorners['bottomright'].style.marginBottom = "20px";

		this._reset();
		this._update();
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);
		//this._container = null;

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);

		this._map.off('zoomanim', this._handleZoomAnim, this);

		map._controlCorners['bottomright'].style.marginBottom = "0em";
		//this._map.off('moveend', this._update, this);
	},

	getAttribution: function() {
		return this.options.attribution;
	},

	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function(e, size) {
		e.style.width = size.x + "px";
		e.style.height = size.y + "px";
	},

	_initContainer: function() {
		var tilePane = this._map._container,
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-google-layer leaflet-top leaflet-left');
			this._container.id = "_GMapContainer_" + L.Util.stamp(this);
			this._container.style.zIndex = "auto";
		}

		if (true) {
			tilePane.insertBefore(this._container, first);

			this.setOpacity(this.options.opacity);
			this.setElementSize(this._container, this._map.getSize());
		}
	},

	_initMapObject: function() {
		if (!this._ready) return;
		this._google_center = new google.maps.LatLng(0, 0);
		var map = new google.maps.Map(this._container, {
		    center: this._google_center,
		    zoom: 0,
		    tilt: 0,
		    mapTypeId: google.maps.MapTypeId[this._type],
		    disableDefaultUI: true,
		    keyboardShortcuts: false,
		    draggable: false,
		    disableDoubleClickZoom: true,
		    scrollwheel: false,
		    streetViewControl: false,
		    styles: this.options.mapOptions.styles,
		    backgroundColor: this.options.mapOptions.backgroundColor
		});

		var _this = this;
		this._reposition = google.maps.event.addListenerOnce(map, "center_changed",
			function() { _this.onReposition(); });
		this._google = map;

		google.maps.event.addListenerOnce(map, "idle",
			function() { _this._checkZoomLevels(); });
	},

	_checkZoomLevels: function() {
		//setting the zoom level on the Google map may result in a different zoom level than the one requested
		//(it won't go beyond the level for which they have data).
		// verify and make sure the zoom levels on both Leaflet and Google maps are consistent
		if (this._google.getZoom() !== this._map.getZoom()) {
			//zoom levels are out of sync. Set the leaflet zoom level to match the google one
			this._map.setZoom( this._google.getZoom() );
		}
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function(e) {
		if (!this._google) return;
		this._resize();

		var center = e && e.latlng ? e.latlng : this._map.getCenter();
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._google.setCenter(_center);
		this._google.setZoom(this._map.getZoom());

		this._checkZoomLevels();
		//this._google.fitBounds(google_bounds);
	},

	_resize: function() {
		var size = this._map.getSize();
		if (this._container.style.width == size.x &&
		    this._container.style.height == size.y)
			return;
		this.setElementSize(this._container, size);
		this.onReposition();
	},


	_handleZoomAnim: function (e) {
		var center = e.center;
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._google.setCenter(_center);
		this._google.setZoom(e.zoom);
	},


	onReposition: function() {
		if (!this._google) return;
		google.maps.event.trigger(this._google, "resize");
	}
});

L.Google.asyncWait = [];
L.Google.asyncInitialize = function() {
	var i;
	for (i = 0; i < L.Google.asyncWait.length; i++) {
		var o = L.Google.asyncWait[i];
		o._ready = true;
		if (o._container) {
			o._initMapObject();
			o._update();
		}
	}
	L.Google.asyncWait = [];
};
//})(window.google, L)

(function(){var f=[].slice;String.prototype.autoLink=function(){var c,e,d,a,b;a=1<=arguments.length?f.call(arguments,0):[];e="";d=a[0];b=/(^|\s)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026@#\/%?=~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~_|])/gi;if(!(0<a.length))return this.replace(b,"$1<a href='$2'>$2</a>");for(c in d)a=d[c],"callback"!==c&&(e+=" "+c+"='"+a+"'");return this.replace(b,function(a,c,b){a=("function"===typeof d.callback?d.callback(b):void 0)||"<a href='"+b+"'"+e+">"+b+"</a>";return""+c+a})}}).call(this);

(function(){/*
 OverlappingMarkerSpiderfier
https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
Copyright (c) 2011 - 2012 George MacKerron
Released under the MIT licence: http://opensource.org/licenses/mit-license
Note: The Leaflet maps API must be included *before* this code
*/
(function(){var q={}.hasOwnProperty,r=[].slice;null!=this.L&&(this.OverlappingMarkerSpiderfier=function(){function n(c,b){var a,e,g,f,d=this;this.map=c;null==b&&(b={});for(a in b)q.call(b,a)&&(e=b[a],this[a]=e);this.initMarkerArrays();this.listeners={};f=["click","zoomend"];e=0;for(g=f.length;e<g;e++)a=f[e],this.map.addEventListener(a,function(){return d.unspiderfy()})}var d,k;d=n.prototype;d.VERSION="0.2.6";k=2*Math.PI;d.keepSpiderfied=!1;d.nearbyDistance=20;d.circleSpiralSwitchover=9;d.circleFootSeparation=
25;d.circleStartAngle=k/12;d.spiralFootSeparation=28;d.spiralLengthStart=11;d.spiralLengthFactor=5;d.legWeight=1.5;d.legColors={usual:"#222",highlighted:"#f00"};d.initMarkerArrays=function(){this.markers=[];return this.markerListeners=[]};d.addMarker=function(c){var b,a=this;if(null!=c._oms)return this;c._oms=!0;b=function(){return a.spiderListener(c)};c.addEventListener("click",b);this.markerListeners.push(b);this.markers.push(c);return this};d.getMarkers=function(){return this.markers.slice(0)};
d.removeMarker=function(c){var b,a;null!=c._omsData&&this.unspiderfy();b=this.arrIndexOf(this.markers,c);if(0>b)return this;a=this.markerListeners.splice(b,1)[0];c.removeEventListener("click",a);delete c._oms;this.markers.splice(b,1);return this};d.clearMarkers=function(){var c,b,a,e,g;this.unspiderfy();g=this.markers;c=a=0;for(e=g.length;a<e;c=++a)b=g[c],c=this.markerListeners[c],b.removeEventListener("click",c),delete b._oms;this.initMarkerArrays();return this};d.addListener=function(c,b){var a,
e;(null!=(e=(a=this.listeners)[c])?e:a[c]=[]).push(b);return this};d.removeListener=function(c,b){var a;a=this.arrIndexOf(this.listeners[c],b);0>a||this.listeners[c].splice(a,1);return this};d.clearListeners=function(c){this.listeners[c]=[];return this};d.trigger=function(){var c,b,a,e,g,f;b=arguments[0];c=2<=arguments.length?r.call(arguments,1):[];b=null!=(a=this.listeners[b])?a:[];f=[];e=0;for(g=b.length;e<g;e++)a=b[e],f.push(a.apply(null,c));return f};d.generatePtsCircle=function(c,b){var a,e,
g,f,d;g=this.circleFootSeparation*(2+c)/k;e=k/c;d=[];for(a=f=0;0<=c?f<c:f>c;a=0<=c?++f:--f)a=this.circleStartAngle+a*e,d.push(new L.Point(b.x+g*Math.cos(a),b.y+g*Math.sin(a)));return d};d.generatePtsSpiral=function(c,b){var a,e,g,f,d;g=this.spiralLengthStart;a=0;d=[];for(e=f=0;0<=c?f<c:f>c;e=0<=c?++f:--f)a+=this.spiralFootSeparation/g+5E-4*e,e=new L.Point(b.x+g*Math.cos(a),b.y+g*Math.sin(a)),g+=k*this.spiralLengthFactor/a,d.push(e);return d};d.spiderListener=function(c){var b,a,e,g,f,d,h,k,l;(b=null!=
c._omsData)&&this.keepSpiderfied||this.unspiderfy();if(b)return this.trigger("click",c);g=[];f=[];d=this.nearbyDistance*this.nearbyDistance;e=this.map.latLngToLayerPoint(c.getLatLng());l=this.markers;h=0;for(k=l.length;h<k;h++)b=l[h],this.map.hasLayer(b)&&(a=this.map.latLngToLayerPoint(b.getLatLng()),this.ptDistanceSq(a,e)<d?g.push({marker:b,markerPt:a}):f.push(b));return 1===g.length?this.trigger("click",c):this.spiderfy(g,f)};d.makeHighlightListeners=function(c){var b=this;return{highlight:function(){return c._omsData.leg.setStyle({color:b.legColors.highlighted})},
unhighlight:function(){return c._omsData.leg.setStyle({color:b.legColors.usual})}}};d.spiderfy=function(c,b){var a,e,g,d,p,h,k,l,n,m;this.spiderfying=!0;m=c.length;a=this.ptAverage(function(){var a,b,e;e=[];a=0;for(b=c.length;a<b;a++)k=c[a],e.push(k.markerPt);return e}());d=m>=this.circleSpiralSwitchover?this.generatePtsSpiral(m,a).reverse():this.generatePtsCircle(m,a);a=function(){var a,b,k,m=this;k=[];a=0;for(b=d.length;a<b;a++)g=d[a],e=this.map.layerPointToLatLng(g),n=this.minExtract(c,function(a){return m.ptDistanceSq(a.markerPt,
g)}),h=n.marker,p=new L.Polyline([h.getLatLng(),e],{color:this.legColors.usual,weight:this.legWeight,clickable:!1}),this.map.addLayer(p),h._omsData={usualPosition:h.getLatLng(),leg:p},this.legColors.highlighted!==this.legColors.usual&&(l=this.makeHighlightListeners(h),h._omsData.highlightListeners=l,h.addEventListener("mouseover",l.highlight),h.addEventListener("mouseout",l.unhighlight)),h.setLatLng(e),h.setZIndexOffset(1E6),k.push(h);return k}.call(this);delete this.spiderfying;this.spiderfied=!0;
return this.trigger("spiderfy",a,b)};d.unspiderfy=function(c){var b,a,e,d,f,k,h;null==c&&(c=null);if(null==this.spiderfied)return this;this.unspiderfying=!0;d=[];e=[];h=this.markers;f=0;for(k=h.length;f<k;f++)b=h[f],null!=b._omsData?(this.map.removeLayer(b._omsData.leg),b!==c&&b.setLatLng(b._omsData.usualPosition),b.setZIndexOffset(0),a=b._omsData.highlightListeners,null!=a&&(b.removeEventListener("mouseover",a.highlight),b.removeEventListener("mouseout",a.unhighlight)),delete b._omsData,d.push(b)):
e.push(b);delete this.unspiderfying;delete this.spiderfied;this.trigger("unspiderfy",d,e);return this};d.ptDistanceSq=function(c,b){var a,e;a=c.x-b.x;e=c.y-b.y;return a*a+e*e};d.ptAverage=function(c){var b,a,e,d,f;d=a=e=0;for(f=c.length;d<f;d++)b=c[d],a+=b.x,e+=b.y;c=c.length;return new L.Point(a/c,e/c)};d.minExtract=function(c,b){var a,d,g,f,k,h;g=k=0;for(h=c.length;k<h;g=++k)if(f=c[g],f=b(f),"undefined"===typeof a||null===a||f<d)d=f,a=g;return c.splice(a,1)[0]};d.arrIndexOf=function(c,b){var a,
d,g,f;if(null!=c.indexOf)return c.indexOf(b);a=g=0;for(f=c.length;g<f;a=++g)if(d=c[a],d===b)return a;return-1};return n}())}).call(this);}).call(this);
/* Mon 14 Oct 2013 10:54:59 BST */


try { console.log('done loading included JS'); } catch(e) {}

//note: no protocol - so uses http or https as used on the current page
var JQUERY = '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';
var JQUERYUI = '//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js';

// after all scripts have loaded, boot the actual app
load(JQUERY).then(JQUERYUI).thenRun(boot);


;

window.chat = function() {};

//WORK IN PROGRESS - NOT YET USED!!
window.chat.commTabs = [
// channel: the COMM channel ('tab' parameter in server requests)
// name: visible name
// inputPrompt: string for the input prompt
// inputColor: (optional) color for input
// sendMessage: (optional) function to send the message (to override the default of sendPlext)
// globalBounds: (optional) if true, always use global latLng bounds
  {channel:'all', name:'All', inputPrompt: 'broadcast:', inputColor:'#f66'},
  {channel:'faction', name:'Aaction', inputPrompt: 'tell faction:'},
  {channel:'alerts', name:'Alerts', inputPrompt: 'tell Jarvis:', inputColor: '#666', globalBounds: true, sendMessage: function() {
    alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");
  }},
];


window.chat.handleTabCompletion = function() {
  var el = $('#chatinput input');
  var curPos = el.get(0).selectionStart;
  var text = el.val();
  var word = text.slice(0, curPos).replace(/.*\b([a-z0-9-_])/, '$1').toLowerCase();

  var list = $('#chat > div:visible mark');
  list = list.map(function(ind, mark) { return $(mark).text(); } );
  list = uniqueArray(list);

  var nick = null;
  for(var i = 0; i < list.length; i++) {
    if(!list[i].toLowerCase().startsWith(word)) continue;
    if(nick && nick !== list[i]) {
      console.log('More than one nick matches, aborting. ('+list[i]+' vs '+nick+')');
      return;
    }
    nick = list[i];
  }
  if(!nick) {
    console.log('No matches for ' + word);
    return;
  }

  var posStart = curPos - word.length;
  var newText = text.substring(0, posStart);
  var atPresent = text.substring(posStart-1, posStart) === '@';
  newText += (atPresent ? '' : '@') + nick + ' ';
  newText += text.substring(curPos);
  el.val(newText);
}

//
// clear management
//


window.chat._oldBBox = null;
window.chat.genPostData = function(channel, storageHash, getOlderMsgs) {
  if (typeof channel !== 'string') throw ('API changed: isFaction flag now a channel string - all, faction, alerts');

  var b = clampLatLngBounds(map.getBounds());

  // set a current bounding box if none set so far
  if (!chat._oldBBox) chat._oldBBox = b;

  // to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box
  // is not considered different
  var CHAT_BOUNDINGBOX_SAME_FACTOR = 0.1;
  // if the old and new box contain each other, after expanding by the factor, don't reset chat
  if (!(b.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(chat._oldBBox) && chat._oldBBox.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(b))) {
    console.log('Bounding Box changed, chat will be cleared (old: '+chat._oldBBox.toBBoxString()+'; new: '+b.toBBoxString()+')');

    $('#chat > div').data('needsClearing', true);

    // need to reset these flags now because clearing will only occur
    // after the request is finished – i.e. there would be one almost
    // useless request.
    chat._faction.data = {};
    chat._faction.oldestTimestamp = -1;
    chat._faction.newestTimestamp = -1;

    chat._public.data = {};
    chat._public.oldestTimestamp = -1;
    chat._public.newestTimestamp = -1;

    chat._alerts.data = {};
    chat._alerts.oldestTimestamp = -1;
    chat._alerts.newestTimestamp = -1;

    chat._oldBBox = b;
  }

  var ne = b.getNorthEast();
  var sw = b.getSouthWest();
  var data = {
//    desiredNumItems: isFaction ? CHAT_FACTION_ITEMS : CHAT_PUBLIC_ITEMS ,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    tab: channel,
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: storageHash.oldestTimestamp});
  } else {
    // ask for newer chat
    var min = storageHash.newestTimestamp;
    // the initial request will have both timestamp values set to -1,
    // thus we receive the newest desiredNumItems. After that, we will
    // only receive messages with a timestamp greater or equal to min
    // above.
    // After resuming from idle, there might be more new messages than
    // desiredNumItems. So on the first request, we are not really up to
    // date. We will eventually catch up, as long as there are less new
    // messages than desiredNumItems per each refresh cycle.
    // A proper solution would be to query until no more new results are
    // returned. Another way would be to set desiredNumItems to a very
    // large number so we really get all new messages since the last
    // request. Setting desiredNumItems to -1 does unfortunately not
    // work.
    // Currently this edge case is not handled. Let’s see if this is a
    // problem in crowded areas.
    $.extend(data, {minTimestampMs: min});
    // when requesting with an actual minimum timestamp, request oldest rather than newest first.
    // this matches the stock intel site, and ensures no gaps when continuing after an extended idle period
    if (min > -1) $.extend(data, {ascendingTimestampOrder: true});
  }
  return data;
}



//
// faction
//

window.chat._requestFactionRunning = false;
window.chat.requestFaction = function(getOlderMsgs, isRetry) {
  if(chat._requestFactionRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestFactionRunning = true;
  $("#chatcontrols a:contains('faction')").addClass('loading');

  var d = chat.genPostData('faction', chat._faction, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleFaction(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestFactionRunning = false; }
      : function() { window.chat.requestFaction(getOlderMsgs, true) }
  );
}


window.chat._faction = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleFaction = function(data, olderMsgs) {
  chat._requestFactionRunning = false;
  $("#chatcontrols a:contains('faction')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('faction chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._faction.oldestTimestamp;
  chat.writeDataToHash(data, chat._faction, false, olderMsgs);
  var oldMsgsWereAdded = old !== chat._faction.oldestTimestamp;

  runHooks('factionChatDataAvailable', {raw: data, result: data.result, processed: chat._faction.data});

  window.chat.renderFaction(oldMsgsWereAdded);
}

window.chat.renderFaction = function(oldMsgsWereAdded) {
  chat.renderData(chat._faction.data, 'chatfaction', oldMsgsWereAdded);
}


//
// all
//

window.chat._requestPublicRunning = false;
window.chat.requestPublic = function(getOlderMsgs, isRetry) {
  if(chat._requestPublicRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestPublicRunning = true;
  $("#chatcontrols a:contains('all')").addClass('loading');

  var d = chat.genPostData('all', chat._public, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handlePublic(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestPublicRunning = false; }
      : function() { window.chat.requestPublic(getOlderMsgs, true) }
  );
}

window.chat._public = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handlePublic = function(data, olderMsgs) {
  chat._requestPublicRunning = false;
  $("#chatcontrols a:contains('all')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('public chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._public.oldestTimestamp;
  chat.writeDataToHash(data, chat._public, undefined, olderMsgs);   //NOTE: isPublic passed as undefined - this is the 'all' channel, so not really public or private
  var oldMsgsWereAdded = old !== chat._public.oldestTimestamp;

  runHooks('publicChatDataAvailable', {raw: data, result: data.result, processed: chat._public.data});

  window.chat.renderPublic(oldMsgsWereAdded);

}

window.chat.renderPublic = function(oldMsgsWereAdded) {
  chat.renderData(chat._public.data, 'chatall', oldMsgsWereAdded);
}


//
// alerts
//

window.chat._requestAlertsRunning = false;
window.chat.requestAlerts = function(getOlderMsgs, isRetry) {
  if(chat._requestAlertsRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestAlertsRunning = true;
  $("#chatcontrols a:contains('alerts')").addClass('loading');

  var d = chat.genPostData('alerts', chat._alerts, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleAlerts(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestAlertsRunning = false; }
      : function() { window.chat.requestAlerts(getOlderMsgs, true) }
  );
}


window.chat._alerts = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleAlerts = function(data, olderMsgs) {
  chat._requestAlertsRunning = false;
  $("#chatcontrols a:contains('alerts')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('alerts chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._alerts.oldestTimestamp;
  chat.writeDataToHash(data, chat._alerts, undefined, olderMsgs); //NOTE: isPublic passed as undefined - it's nether public or private!
  var oldMsgsWereAdded = old !== chat._alerts.oldestTimestamp;

// no hoot for alerts - API change planned here...
//  runHooks('alertsChatDataAvailable', {raw: data, result: data.result, processed: chat._alerts.data});

  window.chat.renderAlerts(oldMsgsWereAdded);
}

window.chat.renderAlerts = function(oldMsgsWereAdded) {
  chat.renderData(chat._alerts.data, 'chatalerts', oldMsgsWereAdded);
}



//
// common
//

window.chat.nicknameClicked = function(event, nickname) {
  var hookData = { event: event, nickname: nickname };
  
  if (window.runHooks('nicknameClicked', hookData)) {
    window.chat.addNickname('@' + nickname);
  }

  event.preventDefault();
  event.stopPropagation();
  return false;
}

window.chat.writeDataToHash = function(newData, storageHash, isPublicChannel, isOlderMsgs) {
  $.each(newData.result, function(ind, json) {
    // avoid duplicates
    if(json[0] in storageHash.data) return true;

    var isSecureMessage = false;
    var msgToPlayer = false;

    var time = json[1];
    var team = json[2].plext.team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
    var auto = json[2].plext.plextType !== 'PLAYER_GENERATED';
    var systemNarrowcast = json[2].plext.plextType === 'SYSTEM_NARROWCAST';

    //track oldest + newest timestamps
    if (storageHash.oldestTimestamp === -1 || storageHash.oldestTimestamp > time) storageHash.oldestTimestamp = time;
    if (storageHash.newestTimestamp === -1 || storageHash.newestTimestamp < time) storageHash.newestTimestamp = time;

    //remove "Your X on Y was destroyed by Z" from the faction channel
//    if (systemNarrowcast && !isPublicChannel) return true;

    var msg = '', nick = '';
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'SENDER': // user generated messages
        nick = markup[1].plain.slice(0, -2); // cut “: ” at end
        break;

      case 'PLAYER': // automatically generated messages
        nick = markup[1].plain;
        team = markup[1].team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
        if(ind > 0) msg += nick; // don’t repeat nick directly
        break;

      case 'TEXT':
        msg += $('<div/>').text(markup[1].plain).html().autoLink();
        break;

      case 'AT_PLAYER':
        var thisToPlayer = (markup[1].plain == ('@'+window.PLAYER.nickname));
        var spanClass = thisToPlayer ? "pl_nudge_me" : (markup[1].team + " pl_nudge_player");
        var atPlayerName = markup[1].plain.replace(/^@/, "");
        msg += $('<div/>').html($('<span/>')
                          .attr('class', spanClass)
                          .attr('onclick',"window.chat.nicknameClicked(event, '"+atPlayerName+"')")
                          .text(markup[1].plain)).html();
        msgToPlayer = msgToPlayer || thisToPlayer;
        break;

      case 'PORTAL':
        var latlng = [markup[1].latE6/1E6, markup[1].lngE6/1E6];
        var perma = '/intel?ll='+latlng[0]+','+latlng[1]+'&z=17&pll='+latlng[0]+','+latlng[1];
        var js = 'window.selectPortalByLatLng('+latlng[0]+', '+latlng[1]+');return false';

        msg += '<a onclick="'+js+'"'
          + ' title="'+markup[1].address+'"'
          + ' href="'+perma+'" class="help">'
          + window.chat.getChatPortalName(markup[1])
          + '</a>';
        break;

      case 'SECURE':
        //NOTE: we won't add the '[secure]' string here - it'll be handled below instead
        isSecureMessage = true;
        break;

      default:
        //handle unknown types by outputting the plain text version, marked with it's type
        msg += $('<div/>').text(markup[0]+':<'+markup[1].plain+'>').html();
        break;
      }
    });


//    //skip secure messages on the public channel
//    if (isPublicChannel && isSecureMessage) return true;

//    //skip public messages (e.g. @player mentions) on the secure channel
//    if ((!isPublicChannel) && (!isSecureMessage)) return true;


    //NOTE: these two are redundant with the above two tests in place - but things have changed...
    //from the server, private channel messages are flagged with a SECURE string '[secure] ', and appear in
    //both the public and private channels
    //we don't include this '[secure]' text above, as it's redundant in the faction-only channel
    //let's add it here though if we have a secure message in the public channel, or the reverse if a non-secure in the faction one
    if (!auto && !(isPublicChannel===false) && isSecureMessage) msg = '<span style="color: #f88; background-color: #500;">[faction]</span> ' + msg;
    //and, add the reverse - a 'public' marker to messages in the private channel
    if (!auto && !(isPublicChannel===true) && (!isSecureMessage)) msg = '<span style="color: #ff6; background-color: #550">[public]</span> ' + msg;


    // format: timestamp, autogenerated, HTML message
    storageHash.data[json[0]] = [json[1], auto, chat.renderMsg(msg, nick, time, team, msgToPlayer, systemNarrowcast), nick];

  });
}

// Override portal names that are used over and over, such as 'US Post Office'
window.chat.getChatPortalName = function(markup) {
  var name = markup.name;
  if(name === 'US Post Office') {
    var address = markup.address.split(',');
    name = 'USPS: ' + address[0];
  }
  return name;
}

// renders data from the data-hash to the element defined by the given
// ID. Set 3rd argument to true if it is likely that old data has been
// added. Latter is only required for scrolling.
window.chat.renderData = function(data, element, likelyWereOldMsgs) {
  var elm = $('#'+element);
  if(elm.is(':hidden')) return;

  // discard guids and sort old to new
//TODO? stable sort, to preserve server message ordering? or sort by GUID if timestamps equal?
  var vals = $.map(data, function(v, k) { return [v]; });
  vals = vals.sort(function(a, b) { return a[0]-b[0]; });

  // render to string with date separators inserted
  var msgs = '';
  var prevTime = null;
  $.each(vals, function(ind, msg) {
    var nextTime = new Date(msg[0]).toLocaleDateString();
    if(prevTime && prevTime !== nextTime)
      msgs += chat.renderDivider(nextTime);
    msgs += msg[2];
    prevTime = nextTime;
  });

  var scrollBefore = scrollBottom(elm);
  elm.html('<table>' + msgs + '</table>');
  chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
}


window.chat.renderDivider = function(text) {
  var d = ' ──────────────────────────────────────────────────────────────────────────';
  return '<tr><td colspan="3" style="padding-top:3px"><summary>─ ' + text + d + '</summary></td></tr>';
}


window.chat.renderMsg = function(msg, nick, time, team, msgToPlayer, systemNarrowcast) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToDateTimeString(time, true);
  //add <small> tags around the milliseconds
  tb = (tb.slice(0,19)+'<small class="milliseconds">'+tb.slice(19)+'</small>').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  if ( msgToPlayer )
  {
    t = '<div class="pl_nudge_date">' + t + '</div><div class="pl_nudge_pointy_spacer"></div>';
  }
  if (systemNarrowcast)
  {
    msg = '<div class="system_narrowcast">' + msg + '</div>';
  }
  var color = COLORS[team];
  if (nick === window.PLAYER.nickname) color = '#fd6';    //highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
  var s = 'style="cursor:pointer; color:'+color+'"';
  var i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
  return '<tr><td>'+t+'</td><td>'+i[0]+'<mark class="nickname" ' + s + '>'+ nick+'</mark>'+i[1]+'</td><td>'+msg+'</td></tr>';
}

window.chat.addNickname= function(nick) {
  var c = document.getElementById("chattext");
  c.value = [c.value.trim(), nick].join(" ").trim() + " ";
  c.focus()
}




window.chat.getActive = function() {
  return $('#chatcontrols .active').text();
}

window.chat.tabToChannel = function(tab) {
  if (tab == 'faction') return 'faction';
  if (tab == 'alerts') return 'alerts';
  return 'all';
};



window.chat.toggle = function() {
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#chatcontrols a:first').html('<span class="toggle expand"></span>');
    c.removeClass('expand');
    var div = $('#chat > div:visible');
    div.data('ignoreNextScroll', true);
    div.scrollTop(99999999); // scroll to bottom
    $('.leaflet-control').css('margin-left', '13px');
  } else {
    $('#chatcontrols a:first').html('<span class="toggle shrink"></span>');
    c.addClass('expand');
    $('.leaflet-control').css('margin-left', '720px');
    chat.needMoreMessages();
  }
}


// called by plugins (or other things?) that need to monitor COMM data streams when the user is not viewing them
// instance: a unique string identifying the plugin requesting background COMM
// channel: either 'all', 'faction' or (soon) 'alerts' - others possible in the future
// flag: true for data wanted, false for not wanted
window.chat.backgroundChannelData = function(instance,channel,flag) {
  //first, store the state for this instance
  if (!window.chat.backgroundInstanceChannel) window.chat.backgroundInstanceChannel = {};
  if (!window.chat.backgroundInstanceChannel[instance]) window.chat.backgroundInstanceChannel[instance] = {};
  window.chat.backgroundInstanceChannel[instance][channel] = flag;

  //now, to simplify the request code, merge the flags for all instances into one
  // 1. clear existing overall flags
  window.chat.backgroundChannels = {};
  // 2. for each instance monitoring COMM...
  $.each(window.chat.backgroundInstanceChannel, function(instance,channels) {
    // 3. and for each channel monitored by this instance...
    $.each(window.chat.backgroundInstanceChannel[instance],function(channel,flag) {
      // 4. if it's monitored, set the channel flag
      if (flag) window.chat.backgroundChannels[channel] = true;
    });
  });

}


window.chat.request = function() {
  console.log('refreshing chat');
  var channel = chat.tabToChannel(chat.getActive());
  if (channel == 'faction' || (window.chat.backgroundChannels && window.chat.backgroundChannels['faction'])) {
    chat.requestFaction(false);
  }
  if (channel == 'all' || (window.chat.backgroundChannels && window.chat.backgroundChannels['all'])) {
    chat.requestPublic(false);
  }
  if (channel == 'alerts' || (window.chat.backgroundChannels && window.chat.backgroundChannels['alerts'])) {
    chat.requestAlerts(false);
  }
}


// checks if there are enough messages in the selected chat tab and
// loads more if not.
window.chat.needMoreMessages = function() {
  var activeTab = chat.getActive();
  if(activeTab === 'debug') return;

  var activeChat = $('#chat > :visible');
  if(activeChat.length === 0) return;

  var hasScrollbar = scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0;
  var nearTop = activeChat.scrollTop() <= CHAT_REQUEST_SCROLL_TOP;
  if(hasScrollbar && !nearTop) return;

  console.log('No scrollbar or near top in active chat. Requesting more data.');

  if(activeTab === 'faction')
    chat.requestFaction(true);
  else
    chat.requestPublic(true);
};


window.chat.chooseTab = function(tab) {
  if (tab != 'all' && tab != 'faction' && tab != 'alerts') {
    console.warn('chat tab "'+tab+'" requested - but only "all", "faction" and "alerts" are valid - assuming "all" wanted');
    tab = 'all';
  }

  var oldTab = chat.getActive();

  localStorage['iitc-chat-tab'] = tab;

  var mark = $('#chatinput mark');
  var input = $('#chatinput input');

  $('#chatcontrols .active').removeClass('active');
  $("#chatcontrols a:contains('" + tab + "')").addClass('active');

  if (tab != oldTab) startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a tab change

  $('#chat > div').hide();

  var elm;

  switch(tab) {
    case 'faction':
      input.css('color', '');
      mark.css('color', '');
      mark.text('tell faction:');

      chat.renderFaction(false);
      break;

    case 'all':
      input.css('cssText', 'color: #f66 !important');
      mark.css('cssText', 'color: #f66 !important');
      mark.text('broadcast:');

      chat.renderPublic(false);
      break;

    case 'alerts':
      mark.css('cssText', 'color: #bbb !important');
      input.css('cssText', 'color: #bbb !important');
      mark.text('tell Jarvis:');

      chat.renderAlerts(false);
      break;

    default:
      throw('chat.chooser was asked to handle unknown button: ' + tt);
  }

  var elm = $('#chat' + tab);
  elm.show();

  if(elm.data('needsScrollTop')) {
    elm.data('ignoreNextScroll', true);
    elm.scrollTop(elm.data('needsScrollTop'));
    elm.data('needsScrollTop', null);
  }
}

window.chat.show = function(name) {
    window.isSmartphone()
        ? $('#updatestatus').hide()
        : $('#updatestatus').show();
    $('#chat, #chatinput').show();

    window.chat.chooseTab(name);
}

window.chat.chooser = function(event) {
  var t = $(event.target);
  var tab = t.text();
  window.chat.chooseTab(tab);
}

// contains the logic to keep the correct scroll position.
window.chat.keepScrollPosition = function(box, scrollBefore, isOldMsgs) {
  // If scrolled down completely, keep it that way so new messages can
  // be seen easily. If scrolled up, only need to fix scroll position
  // when old messages are added. New messages added at the bottom don’t
  // change the view and enabling this would make the chat scroll down
  // for every added message, even if the user wants to read old stuff.

  if(box.is(':hidden') && !isOldMsgs) {
    box.data('needsScrollTop', 99999999);
    return;
  }

  if(scrollBefore === 0 || isOldMsgs) {
    box.data('ignoreNextScroll', true);
    box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore));
  }
}




//
// setup
//

window.chat.setup = function() {
  if (localStorage['iitc-chat-tab']) {
    chat.chooseTab(localStorage['iitc-chat-tab']);
 }

  $('#chatcontrols, #chat, #chatinput').show();

  $('#chatcontrols a:first').click(window.chat.toggle);
  $('#chatcontrols a').each(function(ind, elm) {
    if($.inArray($(elm).text(), ['all', 'faction', 'alerts']) !== -1)
      $(elm).click(window.chat.chooser);
  });


  $('#chatinput').click(function() {
    $('#chatinput input').focus();
  });

  window.chat.setupTime();
  window.chat.setupPosting();

  $('#chatfaction').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestFaction(true);
    if(scrollBottom(t) === 0) chat.requestFaction(false);
  });

  $('#chatall').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestPublic(true);
    if(scrollBottom(t) === 0) chat.requestPublic(false);
  });

  $('#chatalerts').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestAlerts(true);
    if(scrollBottom(t) === 0) chat.requestAlerts(false);
  });

  window.requests.addRefreshFunction(chat.request);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';
  $('#chatinput mark').addClass(cls);

  $(document).on('click', '.nickname', function(event) {
    return window.chat.nicknameClicked(event, $(this).text());
  });
}


window.chat.setupTime = function() {
  var inputTime = $('#chatinput time');
  var updateTime = function() {
    if(window.isIdle()) return;
    var d = new Date();
    var h = d.getHours() + ''; if(h.length === 1) h = '0' + h;
    var m = d.getMinutes() + ''; if(m.length === 1) m = '0' + m;
    inputTime.text(h+':'+m);
    // update ON the minute (1ms after)
    setTimeout(updateTime, (60 - d.getSeconds()) * 1000 + 1);
  };
  updateTime();
  window.addResumeFunction(updateTime);
}


//
// posting
//


window.chat.setupPosting = function() {
  if (!isSmartphone()) {
    $('#chatinput input').keydown(function(event) {
      try {
        var kc = (event.keyCode ? event.keyCode : event.which);
        if(kc === 13) { // enter
          chat.postMsg();
          event.preventDefault();
        } else if (kc === 9) { // tab
          event.preventDefault();
          window.chat.handleTabCompletion();
        }
      } catch(error) {
        console.log(error);
        debug.printStackTrace();
      }
    });
  }

  $('#chatinput').submit(function(event) {
    event.preventDefault();
    chat.postMsg();
  });
}


window.chat.postMsg = function() {
  var c = chat.getActive();
  if(c == 'alerts')
    return alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");

  var msg = $.trim($('#chatinput input').val());
  if(!msg || msg === '') return;

  if(c === 'debug') {
    var result;
    try {
      result = eval(msg);
    } catch(e) {
      if(e.stack) console.error(e.stack);
      throw e; // to trigger native error message
    }
    if(result !== undefined)
      console.log(result.toString());
    return result;
  }

  var latlng = map.getCenter();

  var data = {message: msg,
              latE6: Math.round(latlng.lat*1E6),
              lngE6: Math.round(latlng.lng*1E6),
              tab: c};

  var errMsg = 'Your message could not be delivered. You can copy&' +
               'paste it here and try again if you want:\n\n' + msg;

  window.postAjax('sendPlext', data,
    function(response) {
      if(response.error) alert(errMsg);
      startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a send message
    },
    function() {
      alert(errMsg);
    }
  );

  $('#chatinput input').val('');
}


;

// MAP DATA CACHE ///////////////////////////////////
// cache for map data tiles. 

window.DataCache = function() {
  this.REQUEST_CACHE_FRESH_AGE = 3*60;  // if younger than this, use data in the cache rather than fetching from the server

  this.REQUEST_CACHE_MAX_AGE = 5*60;  // maximum cache age. entries are deleted from the cache after this time

  //NOTE: characters are 16 bits (ECMAScript standard), so divide byte size by two for correct limit
  if (L.Browser.mobile) {
    // on mobile devices, smaller cache size
    this.REQUEST_CACHE_MAX_ITEMS = 300;  // if more than this many entries, expire early
    this.REQUEST_CACHE_MAX_CHARS = 5000000/2; // or more than this total size
  } else {
    // but on desktop, allow more
    this.REQUEST_CACHE_MAX_ITEMS = 1000;  // if more than this many entries, expire early
    this.REQUEST_CACHE_MAX_CHARS = 20000000/2; // or more than this total size
  }

  this._cache = {};
  this._cacheCharSize = 0;

  this._interval = undefined;

}

window.DataCache.prototype.store = function(qk,data,freshTime) {
  // fixme? common behaviour for objects is that properties are kept in the order they're added
  // this is handy, as it allows easy retrieval of the oldest entries for expiring
  // however, this is not guaranteed by the standards, but all our supported browsers work this way

  this.remove(qk);

  var time = new Date().getTime();

  if (freshTime===undefined) freshTime = this.REQUEST_CACHE_FRESH_AGE*1000;
  var expire = time + freshTime;

  var dataStr = JSON.stringify(data);

  this._cacheCharSize += dataStr.length;
  this._cache[qk] = { time: time, expire: expire, dataStr: dataStr };
}

window.DataCache.prototype.remove = function(qk) {
  if (qk in this._cache) {
    this._cacheCharSize -= this._cache[qk].dataStr.length;
    delete this._cache[qk];
  }
}


window.DataCache.prototype.get = function(qk) {
  if (qk in this._cache) return JSON.parse(this._cache[qk].dataStr);
  else return undefined;
}

window.DataCache.prototype.getTime = function(qk) {
  if (qk in this._cache) return this._cache[qk].time;
  else return 0;
}

window.DataCache.prototype.isFresh = function(qk) {
  if (qk in this._cache) {
    var d = new Date();
    var t = d.getTime();
    if (this._cache[qk].expire >= t) return true;
    else return false;
  }

  return undefined;
}

window.DataCache.prototype.startExpireInterval = function(period) {
  if (this._interval === undefined) {
    var savedContext = this;
    this._interval = setInterval (function() { savedContext.runExpire(); }, period*1000);
  }
}

window.DataCache.prototype.stopExpireInterval = function() {
  if (this._interval !== undefined) {
    stopInterval (this._interval);
    this._interval = undefined;
  }
}



window.DataCache.prototype.runExpire = function() {
  var d = new Date();
  var t = d.getTime()-this.REQUEST_CACHE_MAX_AGE*1000;

  var cacheSize = Object.keys(this._cache).length;

  for(var qk in this._cache) {

    // fixme? our MAX_SIZE test here assumes we're processing the oldest first. this relies
    // on looping over object properties in the order they were added. this is true in most browsers,
    // but is not a requirement of the standards
    if (cacheSize > this.REQUEST_CACHE_MAX_ITEMS || this._cacheCharSize > this.REQUEST_CACHE_MAX_CHARS || this._cache[qk].time < t) {
      this._cacheCharSize -= this._cache[qk].dataStr.length;
      delete this._cache[qk];
      cacheSize--;
    }
  }
}


window.DataCache.prototype.debug = function() {
//NOTE: ECMAScript strings use 16 bit chars (it's in the standard), so convert for bytes/Kb
  return 'Cache: '+Object.keys(this._cache).length+' items, '+(this._cacheCharSize*2).toLocaleString()+' bytes ('+Math.ceil(this._cacheCharSize/512).toLocaleString()+'K)';
}


;


// DEBUGGING TOOLS ///////////////////////////////////////////////////
// meant to be used from browser debugger tools and the like.

window.debug = function() {}

window.debug.renderDetails = function() {
  console.log('portals: ' + Object.keys(window.portals).length);
  console.log('links:   ' + Object.keys(window.links).length);
  console.log('fields:  ' + Object.keys(window.fields).length);
}

window.debug.printStackTrace = function() {
  var e = new Error('dummy');
  console.log(e.stack);
  return e.stack;
}



window.debug.console = function() {
  $('#debugconsole').text();
}

window.debug.console.show = function() {
    $('#chat, #chatinput').show();
    window.debug.console.create();
    $('#chatinput mark').css('cssText', 'color: #bbb !important').text('debug:');
    $('#chat > div').hide();
    $('#debugconsole').show();
    $('#chatcontrols .active').removeClass('active');
    $("#chatcontrols a:contains('debug')").addClass('active');
}

window.debug.console.create = function() {
  if($('#debugconsole').length) return;
  $('#chatcontrols').append('<a>debug</a>');
  $('#chatcontrols a:last').click(window.debug.console.show);
  $('#chat').append('<div style="display: none" id="debugconsole"><table></table></div>');
}

window.debug.console.renderLine = function(text, errorType) {
  debug.console.create();
  switch(errorType) {
    case 'error':   var color = '#FF424D'; break;
    case 'warning': var color = '#FFDE42'; break;
    default:        var color = '#eee';
  }
  if(typeof text !== 'string' && typeof text !== 'number') {
    var cache = [];
    text = JSON.stringify(text, function(key, value) {
      if(typeof value === 'object' && value !== null) {
        if(cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null;
  }
  var d = new Date();
  var ta = d.toLocaleTimeString(); // print line instead maybe?
  var tb = d.toLocaleString();
  var t = '<time title="'+tb+'" data-timestamp="'+d.getTime()+'">'+ta+'</time>';
  var s = 'style="color:'+color+'"';
  var l = '<tr><td>'+t+'</td><td><mark '+s+'>'+errorType+'</mark></td><td>'+text+'</td></tr>';
  $('#debugconsole table').prepend(l);
}

window.debug.console.log = function(text) {
  debug.console.renderLine(text, 'notice');
}

window.debug.console.warn = function(text) {
  debug.console.renderLine(text, 'warning');
}

window.debug.console.error = function(text) {
  debug.console.renderLine(text, 'error');
}

window.debug.console.overwriteNative = function() {
  window.debug.console.create();

  var nativeConsole = window.console;
  window.console = {};

  function overwrite(which) {
    window.console[which] = function() {
      nativeConsole[which].apply(nativeConsole, arguments);
      window.debug.console[which].apply(window.debug.console, arguments);
    }
  }

  overwrite("log");
  overwrite("warn");
  overwrite("error");
}

window.debug.console.overwriteNativeIfRequired = function() {
  if(!window.console || L.Browser.mobile)
    window.debug.console.overwriteNative();
}


;

// DIALOGS /////////////////////////////////////////////////////////
// Inspired by TES III: Morrowind. Long live House Telvanni. ///////
////////////////////////////////////////////////////////////////////

/* The global ID of onscreen dialogs.
 * Starts at 0.
 */
window.DIALOG_ID = 0;

/* All onscreen dialogs, keyed by their ID.
 */
window.DIALOGS = {};

/* The number of dialogs on screen.
 */
window.DIALOG_COUNT = 0;

/* The dialog that has focus.
 */
window.DIALOG_FOCUS = null;

/* Controls how quickly the slide toggle animation
 * should play for dialog collapsing and expanding.
 */
window.DIALOG_SLIDE_DURATION = 100;

/* Creates a dialog and puts it onscreen. Takes one argument: options, a JS object.
 * == Common options
 * (text|html): The text or HTML to display in the dialog. Text is auto-converted to HTML.
 * title: The dialog's title.
 * modal: Whether to open a modal dialog. Implies draggable=false; dialogClass='ui-dialog-modal'.
 *        Please note that modal dialogs hijack the entire screen and should only be used in very
 *        specific cases. (If IITC is running on mobile, modal will always be true).
 * id:   A unique ID for this dialog. If a dialog with id `id' is already open and dialog() is called
 *       again, it will be automatically closed.
 *
 * == Callbacks
 * closeCallback: A callback to run on close. Takes no arguments.
 * collapseCallback: A callback to run on dialog collapse.  Takes no arguments.
 * expandCallback:   A callback to run on dialog expansion. Takes no arguments.
 * collapseExpandCallback: A callback to run on both collapse and expand (overrides collapseCallback
 *                         and expandCallback, takes a boolean argument `collapsing' - true if collapsing;
 *                         false if expanding)
 * focusCallback: A callback to run when the dialog gains focus.
 * blurCallback:  A callback to run when the dialog loses focus.
 *
 * See http://docs.jquery.com/UI/API/1.8/Dialog for a list of all the options. If you previously
 * applied a class to your dialog after creating it with alert(), dialogClass may be particularly
 * useful.
 */
window.dialog = function(options) {
  // Override for smartphones. Preserve default behavior and create a modal dialog.
  options = options || {};

  // Build an identifier for this dialog
  var id = 'dialog-' + (options.modal ? 'modal' : (options.id ? options.id : 'anon-' + window.DIALOG_ID++));
  var jqID = '#' + id;
  var html = '';

  // hint for iitc mobile that a dialog was opened
  if (typeof android !== 'undefined' && android && android.dialogOpened) {
    android.dialogOpened(id, true);
  }

  // Convert text to HTML if necessary
  if(options.text) {
    html = window.convertTextToTableMagic(options.text);
  } else if(options.html) {
    html = options.html;
  } else {
    console.log('window.dialog: warning: no text in dialog');
    html = window.convertTextToTableMagic('');
  }

  // Modal dialogs should not be draggable
  if(options.modal) {
    options.dialogClass = (options.dialogClass ? options.dialogClass + ' ' : '') + 'ui-dialog-modal';
    options.draggable = false;
  }

  // Close out existing dialogs.
  if(window.DIALOGS[id]) {
    try {
      var selector = $(window.DIALOGS[id]);
      selector.dialog('close');
      selector.remove();
    } catch(err) {
      console.log('window.dialog: Tried to close nonexistent dialog ' + id);
    }
  }

  // there seems to be a bug where width/height are set to a fixed value after moving a dialog
  function sizeFix() {
    if(dialog.data('collapsed')) return;

    var options = dialog.dialog('option');
    dialog.dialog('option', 'height', options.height);
    dialog.dialog('option', 'width', options.width);
  }

  // Create the window, appending a div to the body
  $('body').append('<div id="' + id + '"></div>');
  var dialog = $(jqID).dialog($.extend(true, {
    autoOpen: false,
    modal: false,
    draggable: true,
    closeText: '&nbsp;',
    title: '',
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
    open: function() {
      var titlebar = $(this).closest('.ui-dialog').find('.ui-dialog-titlebar');
      titlebar.find('.ui-dialog-title').addClass('ui-dialog-title-active');
      var close = titlebar.find('.ui-dialog-titlebar-close');

      // Title should not show up on mouseover
      close.removeAttr('title').addClass('ui-dialog-titlebar-button');

      if(!$(this).dialog('option', 'modal')) {
        // Start out with a cloned version of the close button
        var collapse = close.clone();

        // Change it into a collapse button and set the click handler
        collapse.addClass('ui-dialog-titlebar-button-collapse ui-dialog-titlebar-button-collapse-expanded');
        collapse.click($.proxy(function() {
          var collapsed = ($(this).data('collapsed') === true);

          // Run callbacks if we have them
          if($(this).data('collapseExpandCallback')) {
            $.proxy($(this).data('collapseExpandCallback'), this)(!collapsed);
          } else {
            if(!collapsed && $(this).data('collapseCallback')) {
              $.proxy($(this).data('collapseCallback'), this)();
            } else if (collapsed && $(this).data('expandCallback')) {
              $.proxy($(this).data('expandCallback'), this)();
            }
          }

          // Find the button pane and content dialog in this ui-dialog, and add or remove the 'hidden' class.
          var dialog   = $(this).closest('.ui-dialog');
          var selector = dialog.find('.ui-dialog-content,.ui-dialog-buttonpane');
          var button   = dialog.find('.ui-dialog-titlebar-button-collapse');

          // Slide toggle
          $(this).css('height', '');
          $(selector).slideToggle({duration: window.DIALOG_SLIDE_DURATION, complete: sizeFix});

          if(collapsed) {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-collapsed');
            $(button).addClass('ui-dialog-titlebar-button-collapse-expanded');
          } else {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-expanded');
            $(button).addClass('ui-dialog-titlebar-button-collapse-collapsed');
          }

          // Toggle collapsed state
          $(this).data('collapsed', !collapsed);
        }, this));

        // Put it into the titlebar
        titlebar.prepend(collapse);
        close.addClass('ui-dialog-titlebar-button-close');
      }

      window.DIALOGS[$(this).data('id')] = this;
      window.DIALOG_COUNT++;

      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') opened. ' + window.DIALOG_COUNT + ' remain.');
    },
    close: function() {
      // Run the close callback if we have one
      if($(this).data('closeCallback')) {
        $.proxy($(this).data('closeCallback'), this)();
      }

      // Make sure that we don't keep a dead dialog in focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') === $(this).data('id')) {
        window.DIALOG_FOCUS = null;
      }

      // Finalize
      delete window.DIALOGS[$(this).data('id')];

      window.DIALOG_COUNT--;
      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') closed. ' + window.DIALOG_COUNT + ' remain.');
      // hint for iitc mobile that a dialog was closed
      if (typeof android !== 'undefined' && android && android.dialogOpened) {
        android.dialogOpened(id, false);
      }

      // remove from DOM and destroy
      $(this).dialog('destroy').remove();
    },
    focus: function() {
      if($(this).data('focusCallback')) {
        $.proxy($(this).data('focusCallback'), this)();
      }

      // Blur the window currently in focus unless we're gaining focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') !== $(this).data('id')) {
        $.proxy(function(event, ui) {
          if($(this).data('blurCallback')) {
            $.proxy($(this).data('blurCallback'), this)();
          }

          $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-active').addClass('ui-dialog-title-inactive');
        }, window.DIALOG_FOCUS)();
      }

      // This dialog is now in focus
      window.DIALOG_FOCUS = this;
      // hint for iitc mobile that a dialog was focused
      if (typeof android !== 'undefined' && android && android.dialogFocused) {
        android.dialogFocused($(window.DIALOG_FOCUS).data('id'));
      }
      $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-inactive').addClass('ui-dialog-title-active');
    }
  }, options));

  dialog.on('dialogdragstop dialogresizestop', sizeFix);

  // Set HTML and IDs
  dialog.html(html);
  dialog.data('id', id);
  dialog.data('jqID', jqID);

  // Set callbacks
  dialog.data('closeCallback', options.closeCallback);
  dialog.data('collapseCallback', options.collapseCallback);
  dialog.data('expandCallback', options.expandCallback);
  dialog.data('collapseExpandCallback', options.collapseExpandCallback);
  dialog.data('focusCallback', options.focusCallback);
  dialog.data('blurCallback', options.blurCallback);

  if(options.modal) {
    // ui-modal includes overrides for modal dialogs
    dialog.parent().addClass('ui-modal');
  } else {
    // Enable snapping
    dialog.dialog().parents('.ui-dialog').draggable('option', 'snap', true);
  }

  // Run it
  dialog.dialog('open');

  return dialog;
}

/* Creates an alert dialog with default settings.
 * If you want more configurability, use window.dialog instead.
 */
window.alert = function(text, isHTML, closeCallback) {
  var obj = {closeCallback: closeCallback};
  if(isHTML) {
    obj.html = text;
  } else {
    obj.text = text;
  }

  return dialog(obj);
}

window.setupDialogs = function() {
  window.DIALOG_ID = 0;
  window.DIALOGS   = {}
  window.DIALOG_COUNT = 0;
  window.DIALOG_FOCUS = null;
}


;

// decode the on-network array entity format into an object format closer to that used before
// makes much more sense as an object, means that existing code didn't need to change, and it's what the
// stock intel site does internally too (the array format is only on the network)


// anonymous wrapper function
(function(){
  window.decodeArray = function(){};


  function parseMod(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      name: arr[1],
      rarity: arr[2],
      stats: arr[3],
    };
  }
  function parseResonator(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      level: arr[1],
      energy: arr[2],
    };
  }
  function parseArtifactBrief(arr) {
    if (arr === null) return null;

    // array index 0 is for fragments at the portal. index 1 is for target portals
    // each of those is two dimensional - not sure why. part of this is to allow for multiple types of artifacts,
    // with their own targets, active at once - but one level for the array is enough for that

    // making a guess - first level is for different artifact types, second index would allow for
    // extra data for that artifact type

    function decodeArtifactArray(arr) {
      var result = {};
      for (var i=0; i<arr.length; i++) {
        // we'll use the type as the key - and store any additional array values as the value
        // that will be an empty array for now, so only object keys are useful data
        result[arr[i][0]] = arr[i].slice(1);
      }
      return result;
    }

    return {
      fragment: decodeArtifactArray(arr[0]),
      target: decodeArtifactArray(arr[1]),
    };
  }

  function parseArtifactDetail(arr) {
    if (arr == null) { return null; }
    // empty artifact data is pointless - ignore it
    if (arr.length == 3 && arr[0] == "" && arr[1] == "" && arr[2].length == 0) { return null; }
    return {
      type: arr[0],
      displayName: arr[1],
      fragments: arr[2],
    };
  }


//there's also a 'placeholder' portal - generated from the data in links/fields. only has team/lat/lng

  var CORE_PORTA_DATA_LENGTH = 4;
  function corePortalData(a) {
    return {
      // a[0] == type (always 'p')
      team:          a[1],
      latE6:         a[2],
      lngE6:         a[3]
    }
  };

  var SUMMARY_PORTAL_DATA_LENGTH = 14;
  function summaryPortalData(a) {
    return {
      level:         a[4],
      health:        a[5],
      resCount:      a[6],
      image:         a[7],
      title:         a[8],
      ornaments:     a[9],
      mission:       a[10],
      mission50plus: a[11],
      artifactBrief: parseArtifactBrief(a[12]),
      timestamp:     a[13]
    };
  };

  var DETAILED_PORTAL_DATA_LENGTH = SUMMARY_PORTAL_DATA_LENGTH+4;


  window.decodeArray.portalSummary = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalSUmmary - not a portal';

    if (a.length == CORE_PORTA_DATA_LENGTH) {
      return corePortalData(a);
    }

    // NOTE: allow for either summary or detailed portal data to be passed in here, as details are sometimes
    // passed into code only expecting summaries
    if (a.length != SUMMARY_PORTAL_DATA_LENGTH && a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal summary length changed - portal details likely broken!');
      debugger;
    }

    return $.extend(corePortalData(a), summaryPortalData(a));
  }

  window.decodeArray.portalDetail = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalDetail - not a portal';

    if (a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal detail length changed - portal details may be wrong');
      debugger;
    }

    //TODO look at the array values, make a better guess as to which index the mods start at, rather than using the hard-coded SUMMARY_PORTAL_DATA_LENGTH constant


    // the portal details array is just an extension of the portal summary array
    // to allow for niantic adding new items into the array before the extended details start,
    // use the length of the summary array
    return $.extend(corePortalData(a), summaryPortalData(a),{
      mods:      a[SUMMARY_PORTAL_DATA_LENGTH+0].map(parseMod),
      resonators:a[SUMMARY_PORTAL_DATA_LENGTH+1].map(parseResonator),
      owner:     a[SUMMARY_PORTAL_DATA_LENGTH+2],
      artifactDetail:  parseArtifactDetail(a[SUMMARY_PORTAL_DATA_LENGTH+3]),
    });
    
  }


})();


;



// ENTITY DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of an entity (i.e.
// portal, link, field) and they will return useful data.


// given the entity detail data, returns the team the entity belongs
// to. Uses TEAM_* enum values.
window.getTeam = function(details) {
  return teamStringToId(details.team);
}

window.teamStringToId = function(teamStr) {
  var team = TEAM_NONE;
  if(teamStr === 'ENLIGHTENED') team = TEAM_ENL;
  if(teamStr === 'RESISTANCE') team = TEAM_RES;
  if(teamStr === 'E') team = TEAM_ENL;
  if(teamStr === 'R') team = TEAM_RES;
  return team;
}




;

// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}

  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('"X-CSRFToken".*[a-z].v="([a-f0-9]{40})";');

  var minified = new RegExp('^[a-zA-Z$][a-zA-Z$0-9]?$');

  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      // a minified object - check for minified prototype entries

      var topObject = window[topLevel];
      if (topObject && topObject.prototype) {

        // the object has a prototype - iterate through the properties of that
        for (var secLevel in topObject.prototype) {
          if (minified.test(secLevel)) {
            // looks like we've found an object of the format "XX.prototype.YY"...
            var item = topObject.prototype[secLevel];

            if (item && typeof(item) == "function") {
              // a function - test it against the relevant regular expressions
              var funcStr = item.toString();

              var match = reVersion.exec(funcStr);
              if (match) {
                console.log('Found former CURRENT_VERSION in '+topLevel+'.prototype.'+secLevel);
                niantic_params.CURRENT_VERSION = match[1];
              }
            }
          }
        }

      } //end 'if .prototype'

      if (topObject && Array.isArray && Array.isArray(topObject)) {
        // find all non-zero length arrays containing just numbers
        if (topObject.length>0) {
          var justInts = true;
          for (var i=0; i<topObject.length; i++) {
            if (typeof(topObject[i]) !== 'number' || topObject[i] != parseInt(topObject[i])) {
              justInts = false;
              break;
            }
          }
          if (justInts) {

            // current lengths are: 17: ZOOM_TO_LEVEL, 14: TILES_PER_EDGE
            // however, slightly longer or shorter are a possibility in the future

            if (topObject.length >= 12 && topObject.length <= 18) {
              // a reasonable array length for tile parameters
              // need to find two types:
              // a. portal level limits. decreasing numbers, starting at 8
              // b. tiles per edge. increasing numbers. current max is 36000, 9000 was the previous value - 18000 is a likely possibility too

              if (topObject[0] == 8) {
                // check for tile levels
                var decreasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] < topObject[i]) {
                    decreasing = false;
                    break;
                  }
                }
                if (decreasing) {
                  console.log ('int array '+topLevel+' looks like ZOOM_TO_LEVEL: '+JSON.stringify(topObject));
                  window.niantic_params.ZOOM_TO_LEVEL = topObject;
                }
              } // end if (topObject[0] == 8)

              // 2015-06-25 - changed to top value of 64000, then to 32000 - allow for them to restore it just in case
              if (topObject[topObject.length-1] >= 9000 && topObject[topObject.length-1] <= 64000) {
                var increasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] > topObject[i]) {
                    increasing = false;
                    break;
                  }
                }
                if (increasing) {
                  console.log ('int array '+topLevel+' looks like TILES_PER_EDGE: '+JSON.stringify(topObject));
                  window.niantic_params.TILES_PER_EDGE = topObject;
                }

              } //end if (topObject[topObject.length-1] == 9000) {

            }
          }
        }
      }


    }
  }


  if (niantic_params.CURRENT_VERSION === undefined) {
    dialog({
      title: 'IITC Broken',
      html: '<p>IITC failed to extract the required parameters from the intel site</p>'
           +'<p>This can happen after Niantic update the standard intel site. A fix will be needed from the IITC developers.</p>',
    });

    console.log('Discovered parameters');
    console.log(JSON.stringify(window.niantic_params,null,2));

    throw('Error: IITC failed to extract CURRENT_VERSION string - cannot continue');
  }

}



;


// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display


window.updateGameScore = function(data) {
  if(!data) {
    // move the postAjax call onto a very short timer. this way, if it throws an exception, it won't prevent IITC booting
    setTimeout (function() { window.postAjax('getGameScore', {}, window.updateGameScore); }, 1);
    return;
  }

  if (data && data.result) {

    var e = parseInt(data.result[0]); //enlightened score in result[0]
    var r = parseInt(data.result[1]); //resistance score in result[1]
    var s = r+e;
    var rp = r/s*100, ep = e/s*100;
    r = digits(r), e = digits(e);
    var rs = '<span class="res" style="width:'+rp+'%;">'+Math.round(rp)+'%&nbsp;</span>';
    var es = '<span class="enl" style="width:'+ep+'%;">&nbsp;'+Math.round(ep)+'%</span>';
    $('#gamestat').html(rs+es).one('click', function() { window.updateGameScore() });
    // help cursor via “#gamestat span”
    $('#gamestat').attr('title', 'Resistance:\t'+r+' MindUnits\nEnlightened:\t'+e+' MindUnits');
  } else if (data && data.error) {
    console.warn('game score failed to load: '+data.error);
  } else {
    console.warn('game score failed to load - unknown reason');
  }

  // TODO: idle handling - don't refresh when IITC is idle!
  window.setTimeout('window.updateGameScore', REFRESH_GAME_SCORE*1000);
}


;

// PLUGIN HOOKS ////////////////////////////////////////////////////////
// Plugins may listen to any number of events by specifying the name of
// the event to listen to and handing a function that should be exe-
// cuted when an event occurs. Callbacks will receive additional data
// the event created as their first parameter. The value is always a
// hash that contains more details.
//
// For example, this line will listen for portals to be added and print
// the data generated by the event to the console:
// window.addHook('portalAdded', function(data) { console.log(data) });
//
// Boot hook: booting is handled differently because IITC may not yet
//            be available. Have a look at the plugins in plugins/. All
//            code before “// PLUGIN START” and after “// PLUGIN END” is
//            required to successfully boot the plugin.
//
// Here’s more specific information about each event:
// portalSelected: called when portal on map is selected/unselected.
//              Provide guid of selected and unselected portal.
// mapDataRefreshStart: called when we start refreshing map data
// mapDataEntityInject: called just as we start to render data. has callback to inject cached entities into the map render
// mapDataRefreshEnd: called when we complete the map data load
// portalAdded: called when a portal has been received and is about to
//              be added to its layer group. Note that this does NOT
//              mean it is already visible or will be, shortly after.
//              If a portal is added to a hidden layer it may never be
//              shown at all. Injection point is in
//              code/map_data.js#renderPortal near the end. Will hand
//              the Leaflet CircleMarker for the portal in "portal" var.
// linkAdded:   called when a link is about to be added to the map
// fieldAdded:  called when a field is about to be added to the map
// portalRemoved: called when a portal has been removed
// linkRemoved: called when a link has been removed
// fieldRemoved: called when a field has been removed
// portalDetailsUpdated: fired after the details in the sidebar have
//              been (re-)rendered Provides data about the portal that
//              has been selected.
// publicChatDataAvailable: this hook runs after data for any of the
//              public chats has been received and processed, but not
//              yet been displayed. The data hash contains both the un-
//              processed raw ajax response as well as the processed
//              chat data that is going to be used for display.
// factionChatDataAvailable: this hook runs after data for the faction
//              chat has been received and processed, but not yet been
//              displayed. The data hash contains both the unprocessed
//              raw ajax response as well as the processed chat data
//              that is going to be used for display.
// requestFinished: DEPRECATED: best to use mapDataRefreshEnd instead
//              called after each map data request finished. Argument is
//              {success: boolean} indicated the request success or fail.
// iitcLoaded: called after IITC and all plugins loaded
// portalDetailLoaded: called when a request to load full portal detail
//              completes. guid, success, details parameters
// paneChanged  called when the current pane has changed. On desktop,
//              this only selects the current chat pane; on mobile, it
//              also switches between map, info and other panes defined
//              by plugins
// artifactsUpdated: called when the set of artifacts (including targets)
//              has changed. Parameters names are old, new.

window._hooks = {}
window.VALID_HOOKS = [
  'portalSelected', 'portalDetailsUpdated', 'artifactsUpdated',
  'mapDataRefreshStart', 'mapDataEntityInject', 'mapDataRefreshEnd',
  'portalAdded', 'linkAdded', 'fieldAdded',
  'portalRemoved', 'linkRemoved', 'fieldRemoved',
  'publicChatDataAvailable', 'factionChatDataAvailable',
  'requestFinished', 'nicknameClicked',
  'geoSearch', 'search', 'iitcLoaded',
  'portalDetailLoaded', 'paneChanged'];

window.runHooks = function(event, data) {
  if(VALID_HOOKS.indexOf(event) === -1) throw('Unknown event type: ' + event);

  if(!_hooks[event]) return true;
  var interrupted = false;
  $.each(_hooks[event], function(ind, callback) {
    try {
      if (callback(data) === false) {
        interrupted = true;
        return false;  //break from $.each
      }
    } catch(err) {
      console.error('error running hook '+event+', error: '+err);
      debugger;
    }
  });
  return !interrupted;
}

// helper method to allow plugins to create new hooks
window.pluginCreateHook = function(event) {
  if($.inArray(event, window.VALID_HOOKS) < 0) {
    window.VALID_HOOKS.push(event);
  }
}


window.addHook = function(event, callback) {
  if(VALID_HOOKS.indexOf(event) === -1) {
    console.error('addHook: Unknown event type: ' + event + ' - ignoring');
    debugger;
    return;
  }

  if(typeof callback !== 'function') throw('Callback must be a function.');

  if(!_hooks[event])
    _hooks[event] = [callback];
  else
    _hooks[event].push(callback);
}

// callback must the SAME function to be unregistered.
window.removeHook = function(event, callback) {
  if (typeof callback !== 'function') throw('Callback must be a function.');

  if (_hooks[event]) {
    var index = _hooks[event].indexOf(callback);
    if(index == -1)
      console.warn('Callback wasn\'t registered for this event.');
    else
      _hooks[event].splice(index, 1);
  }
}


;

// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in seconds
window._idleTimeLimit = MAX_IDLE_TIME;

var IDLE_POLL_TIME = 10;

var idlePoll = function() {
  var wasIdle = isIdle();
  window.idleTime += IDLE_POLL_TIME;

  var hidden = (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || false);
  if (hidden) {
    window._idleTimeLimit = window.REFRESH; // set a small time limit before entering idle mode
  }
  if (!wasIdle && isIdle()) {
    console.log('idlePoll: entering idle mode');
  }
}

setInterval(idlePoll, IDLE_POLL_TIME*1000);

window.idleReset = function () {
  // update immediately when the user comes back
  if(isIdle()) {
    console.log ('idleReset: leaving idle mode');
    window.idleTime = 0;
    $.each(window._onResumeFunctions, function(ind, f) {
      f();
    });
  }
  window.idleTime = 0;
  window._idleTimeLimit = MAX_IDLE_TIME;
};

window.idleSet = function() {
  var wasIdle = isIdle();

  window._idleTimeLimit = 0; // a zero time here will cause idle to start immediately

  if (!wasIdle && isIdle()) {
    console.log ('idleSet: entering idle mode');
  }
}


// only reset idle on mouse move where the coordinates are actually different.
// some browsers send the event when not moving!
var _lastMouseX=-1, _lastMouseY=-1;
var idleMouseMove = function(e) {
  var dX = _lastMouseX-e.clientX;
  var dY = _lastMouseY-e.clientY;
  var deltaSquared = dX*dX + dY*dY;
  // only treat movements over 3 pixels as enough to reset us
  if (deltaSquared > 3*3) {
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    idleReset();
  }
}

window.setupIdle = function() {
  $('body').keypress(idleReset);
  $('body').mousemove(idleMouseMove);
}


window.isIdle = function() {
  return window.idleTime >= window._idleTimeLimit;
}

window._onResumeFunctions = [];

// add your function here if you want to be notified when the user
// resumes from being idle
window.addResumeFunction = function(f) {
  window._onResumeFunctions.push(f);
}


;


// LOCATION HANDLING /////////////////////////////////////////////////
// i.e. setting initial position and storing new position after moving

// retrieves current position from map and stores it cookies
window.storeMapPosition = function() {
  var m = window.map.getCenter();

  if(m['lat'] >= -90  && m['lat'] <= 90)
    writeCookie('ingress.intelmap.lat', m['lat']);

  if(m['lng'] >= -180 && m['lng'] <= 180)
    writeCookie('ingress.intelmap.lng', m['lng']);

  writeCookie('ingress.intelmap.zoom', window.map.getZoom());
}


// either retrieves the last shown position from a cookie, from the
// URL or if neither is present, via Geolocation. If that fails, it
// returns a map that shows the whole world.
window.getPosition = function() {
  if(getURLParam('latE6') && getURLParam('lngE6')) {
    console.log("mappos: reading email URL params");
    var lat = parseInt(getURLParam('latE6'))/1E6 || 0.0;
    var lng = parseInt(getURLParam('lngE6'))/1E6 || 0.0;
    var z = parseInt(getURLParam('z')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  if(getURLParam('ll')) {
    console.log("mappos: reading stock Intel URL params");
    var lat = parseFloat(getURLParam('ll').split(",")[0]) || 0.0;
    var lng = parseFloat(getURLParam('ll').split(",")[1]) || 0.0;
    var z = parseInt(getURLParam('z')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  if(getURLParam('pll')) {
    console.log("mappos: reading stock Intel URL portal params");
    var lat = parseFloat(getURLParam('pll').split(",")[0]) || 0.0;
    var lng = parseFloat(getURLParam('pll').split(",")[1]) || 0.0;
    var z = parseInt(getURLParam('z')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  if(readCookie('ingress.intelmap.lat') && readCookie('ingress.intelmap.lng')) {
    console.log("mappos: reading cookies");
    var lat = parseFloat(readCookie('ingress.intelmap.lat')) || 0.0;
    var lng = parseFloat(readCookie('ingress.intelmap.lng')) || 0.0;
    var z = parseInt(readCookie('ingress.intelmap.zoom')) || 17;

    if(lat < -90  || lat > 90) lat = 0.0;
    if(lng < -180 || lng > 180) lng = 0.0;

    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  setTimeout("window.map.locate({setView : true});", 50);

  return {center: new L.LatLng(0.0, 0.0), zoom: 1};
}


;

// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data.
//
// Conversion functions courtesy of
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames


window.setupDataTileParams = function() {
  // default values - used to fall back to if we can't detect those used in stock intel
  var DEFAULT_ZOOM_TO_TILES_PER_EDGE = [1,1,1,40,40,80,80,320,1000,2000,2000,4000,8000,16000,16000,32000];
  var DEFAULT_ZOOM_TO_LEVEL = [8,8,8,8,7,7,7,6,6,5,4,4,3,2,2,1,1];

  // stock intel doesn't have this array (they use a switch statement instead), but this is far neater
  var DEFAULT_ZOOM_TO_LINK_LENGTH = [200000,200000,200000,200000,200000,60000,60000,10000,5000,2500,2500,800,300,0,0];

  window.TILE_PARAMS = {};

  // not in stock to detect - we'll have to assume the above values...
  window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH = DEFAULT_ZOOM_TO_LINK_LENGTH;


  if (niantic_params.ZOOM_TO_LEVEL && niantic_params.TILES_PER_EDGE) {
    window.TILE_PARAMS.ZOOM_TO_LEVEL = niantic_params.ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = niantic_params.TILES_PER_EDGE;


    // lazy numerical array comparison
    if ( JSON.stringify(niantic_params.ZOOM_TO_LEVEL) != JSON.stringify(DEFAULT_ZOOM_TO_LEVEL)) {
      console.warn('Tile parameter ZOOM_TO_LEVEL have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }
    if ( JSON.stringify(niantic_params.TILES_PER_EDGE) != JSON.stringify(DEFAULT_ZOOM_TO_TILES_PER_EDGE)) {
      console.warn('Tile parameter TILES_PER_EDGE have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }

  } else {
    dialog({
      title: 'IITC Warning',
      html: "<p>IITC failed to detect the ZOOM_TO_LEVEL and/or TILES_PER_EDGE settings from the stock intel site.</p>"
           +"<p>IITC is now using fallback default values. However, if detection has failed it's likely the values have changed."
           +" IITC may not load the map if these default values are wrong.</p>",
    });

    window.TILE_PARAMS.ZOOM_TO_LEVEL = DEFAULT_ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = DEFAULT_ZOOM_TO_TILES_PER_EDGE;
  }

  // 2015-07-01: niantic added code to the stock site that overrides the min zoom level for unclaimed portals to 15 and above
  // instead of updating the zoom-to-level array. makes no sense really....
  // we'll just chop off the array at that point, so the code defaults to level 0 (unclaimed) everywhere...
  window.TILE_PARAMS.ZOOM_TO_LEVEL = window.TILE_PARAMS.ZOOM_TO_LEVEL.slice(0,15);

}


window.debugMapZoomParameters = function() {

  //for debug purposes, log the tile params used for each zoom level
  console.log('DEBUG: Map Zoom Parameters');
  var doneZooms = {};
  for (var z=MIN_ZOOM; z<=21; z++) {
    var ourZoom = getDataZoomForMapZoom(z);
    console.log('DEBUG: map zoom '+z+': IITC requests '+ourZoom+(ourZoom!=z?' instead':''));
    if (!doneZooms[ourZoom]) {
      var params = getMapZoomTileParameters(ourZoom);
      var msg = 'DEBUG: data zoom '+ourZoom;
      if (params.hasPortals) {
        msg += ' has portals, L'+params.level+'+';
      } else {
        msg += ' NO portals (was L'+params.level+'+)';
      }
      msg += ', minLinkLength='+params.minLinkLength;
      msg += ', tiles per edge='+params.tilesPerEdge;
      console.log(msg);
      doneZooms[ourZoom] = true;
    }
  }
}



window.getMapZoomTileParameters = function(zoom) {


  // the current API allows the client to request a minimum portal level. the window.TILE_PARAMS.ZOOM_TO_LEVEL list are minimums
  // however, in my view, this can return excessive numbers of portals in many cases. let's try an optional reduction
  // of detail level at some zoom levels

  var level = window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0;  // default to level 0 (all portals) if not in array

//  if (window.CONFIG_ZOOM_SHOW_LESS_PORTALS_ZOOMED_OUT) {
//    if (level <= 7 && level >= 4) {
//      // reduce portal detail level by one - helps reduce clutter
//      level = level+1;
//    }
//  }

  var maxTilesPerEdge = window.TILE_PARAMS.TILES_PER_EDGE[window.TILE_PARAMS.TILES_PER_EDGE.length-1];

  return {
    level: level,
    maxLevel: window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0,  // for reference, for log purposes, etc
    tilesPerEdge: window.TILE_PARAMS.TILES_PER_EDGE[zoom] || maxTilesPerEdge,
    minLinkLength: window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH[zoom] || 0,
    hasPortals: zoom >= window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH.length,  // no portals returned at all when link length limits things
    zoom: zoom  // include the zoom level, for reference
  };
}


window.getDataZoomForMapZoom = function(zoom) {
  // we can fetch data at a zoom level different to the map zoom.

  //NOTE: the specifics of this are tightly coupled with the above ZOOM_TO_LEVEL and TILES_PER_EDGE arrays

  // firstly, some of IITCs zoom levels, depending on base map layer, can be higher than stock. limit zoom level
  // (stock site max zoom may vary depending on google maps detail in the area - 20 or 21 max is common)
  if (zoom > 21) {
    zoom = 21;
  }


  if (!window.CONFIG_ZOOM_DEFAULT_DETAIL_LEVEL) {

    // to improve the cacheing performance, we try and limit the number of zoom levels we retrieve data for
    // to avoid impacting server load, we keep ourselves restricted to a zoom level with the sane numbre
    // of tilesPerEdge and portal levels visible

    var origTileParams = getMapZoomTileParameters(zoom);

    while (zoom > MIN_ZOOM) {
      var newTileParams = getMapZoomTileParameters(zoom-1);

      if ( newTileParams.tilesPerEdge != origTileParams.tilesPerEdge
        || newTileParams.hasPortals != origTileParams.hasPortals
        || newTileParams.level*newTileParams.hasPortals != origTileParams.level*origTileParams.hasPortals  // multiply by 'hasPortals' bool - so comparison does not matter when no portals available
      ) {
        // switching to zoom-1 would result in a different detail level - so we abort changing things
        break;
      } else {
        // changing to zoom = zoom-1 results in identical tile parameters - so we can safely step back
        // with no increase in either server load or number of requests
        zoom = zoom-1;
      }
    }

  }

  return zoom;
}


window.lngToTile = function(lng, params) {
  return Math.floor((lng + 180) / 360 * params.tilesPerEdge);
}

window.latToTile = function(lat, params) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * params.tilesPerEdge);
}

window.tileToLng = function(x, params) {
  return x / params.tilesPerEdge * 360 - 180;
}

window.tileToLat = function(y, params) {
  var n = Math.PI - 2 * Math.PI * y / params.tilesPerEdge;
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(params, x, y) {
//change to quadkey construction
//as of 2014-05-06: zoom_x_y_minlvl_maxlvl_maxhealth

  return params.zoom + "_" + x + "_" + y + "_" + params.level + "_8_100";
}


window.getResonatorLatLng = function(dist, slot, portalLatLng) {
  // offset in meters
  var dn = dist*SLOT_TO_LAT[slot];
  var de = dist*SLOT_TO_LNG[slot];

  // Coordinate offset in radians
  var dLat = dn/EARTH_RADIUS;
  var dLon = de/(EARTH_RADIUS*Math.cos(Math.PI/180*portalLatLng[0]));

  // OffsetPosition, decimal degrees
  var lat0 = portalLatLng[0] + dLat * 180/Math.PI;
  var lon0 = portalLatLng[1] + dLon * 180/Math.PI;

  return [lat0, lon0];
}


;

// MAP DATA DEBUG //////////////////////////////////////
// useful bits to assist debugging map data tiles


window.RenderDebugTiles = function() {
  this.CLEAR_CHECK_TIME = L.Path.CANVAS ? 2.0 : 0.5;
  this.FADE_TIME = 2.0;

  this.debugTileLayer = L.layerGroup();
  window.addLayerGroup("DEBUG Data Tiles", this.debugTileLayer, false);

  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
  this.timer = undefined;
}

window.RenderDebugTiles.prototype.reset = function() {
  this.debugTileLayer.clearLayers();
  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
}

window.RenderDebugTiles.prototype.create = function(id,bounds) {
  var s = {color: '#666', weight: 2, opacity: 0.4, fillColor: '#666', fillOpacity: 0.1, clickable: false};

  var bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  this.debugTileToRectangle[id] = l;
  this.debugTileLayer.addLayer(l);
  if (map.hasLayer(this.debugTileLayer)) {
    // only bring to back if we have the debug layer turned on
    l.bringToBack();
  }
}

window.RenderDebugTiles.prototype.setColour = function(id,bordercol,fillcol) {
  var l = this.debugTileToRectangle[id];
  if (l) {
    var s = {color: bordercol, fillColor: fillcol};
    l.setStyle(s);
  }
}

window.RenderDebugTiles.prototype.setState = function(id,state) {
  var col = '#f0f';
  var fill = '#f0f';
  var clearDelay = -1;
  switch(state) {
    case 'ok': col='#0f0'; fill='#0f0'; clearDelay = 2; break;
    case 'error': col='#f00'; fill='#f00'; clearDelay = 30; break;
    case 'cache-fresh': col='#0f0'; fill='#ff0'; clearDelay = 2; break;
    case 'cache-stale': col='#f00'; fill='#ff0'; clearDelay = 10; break;
    case 'requested': col='#66f'; fill='#66f'; break;
    case 'retrying': col='#666'; fill='#666'; break;
    case 'request-fail': col='#a00'; fill='#666'; break;
    case 'tile-fail': col='#f00'; fill='#666'; break;
    case 'tile-timeout': col='#ff0'; fill='#666'; break;
    case 'render-queue': col='#f0f'; fill='#f0f'; break;
  }
  this.setColour (id, col, fill);
  if (clearDelay >= 0) {
    var clearAt = Date.now() + clearDelay*1000;
    this.debugTileClearTimes[id] = clearAt;

    if (!this.timer) {
      this.startTimer(clearDelay*1000);
    }
  }
}


window.RenderDebugTiles.prototype.startTimer = function(waitTime) {
  var _this = this;
  if (!_this.timer) {
    // a timeout of 0 firing the actual timeout - helps things run smoother
    _this.timer = setTimeout ( function() {
      _this.timer = setTimeout ( function() { _this.timer = undefined; _this.runClearPass(); }, waitTime );
    }, 0);
  }
}

window.RenderDebugTiles.prototype.runClearPass = function() {

  var now = Date.now();
  for (var id in this.debugTileClearTimes) {
    var diff = now - this.debugTileClearTimes[id];
    if (diff > 0) {
      if (diff > this.FADE_TIME*1000) {
        this.debugTileLayer.removeLayer(this.debugTileToRectangle[id]);
        delete this.debugTileClearTimes[id];
      } else {
        var fade = 1.0 - (diff / (this.FADE_TIME*1000));

        this.debugTileToRectangle[id].setStyle ({ opacity: 0.4*fade, fillOpacity: 0.1*fade });
      }
    }
  }

  if (Object.keys(this.debugTileClearTimes).length > 0) {
    this.startTimer(this.CLEAR_CHECK_TIME*1000);
  }
}


;

// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {
  this.portalMarkerScale = undefined;
}

// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function(level,bounds) {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass

  this.seenPortalsGuid = {};
  this.seenLinksGuid = {};
  this.seenFieldsGuid = {};

  this.bounds = bounds;
  this.level = level;

  // we pad the bounds used for clearing a litle bit, as entities are sometimes returned outside of their specified tile boundaries
  // this will just avoid a few entity removals at start of render when they'll just be added again
  var paddedBounds = bounds.pad(0.1);

  this.clearPortalsOutsideBounds(paddedBounds);

  this.clearLinksOutsideBounds(paddedBounds);
  this.clearFieldsOutsideBounds(paddedBounds);


  this.rescalePortalMarkers();
}

window.Render.prototype.clearPortalsOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.portals) {
    var p = portals[guid];
    // clear portals outside visible bounds - unless it's the selected portal, or it's relevant to artifacts
    if (!bounds.contains(p.getLatLng()) && guid !== selectedPortal && !artifact.isInterestingPortal(guid)) {
      this.deletePortalEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' portals by level/bounds');
}

window.Render.prototype.clearLinksOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.links) {
    var l = links[guid];

    // NOTE: our geodesic lines can have lots of intermediate points. the bounds calculation hasn't been optimised for this
    // so can be particularly slow. a simple bounds check based on start+end point will be good enough for this check
    var lls = l.getLatLngs();
    var linkBounds = L.latLngBounds(lls);

    if (!bounds.intersects(linkBounds)) {
      this.deleteLinkEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' links by bounds');
}

window.Render.prototype.clearFieldsOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.fields) {
    var f = fields[guid];

    // NOTE: our geodesic polys can have lots of intermediate points. the bounds calculation hasn't been optimised for this
    // so can be particularly slow. a simple bounds check based on corner points will be good enough for this check
    var lls = f.getLatLngs();
    var fieldBounds = L.latLngBounds([lls[0],lls[1]]).extend(lls[2]);

    if (!bounds.intersects(fieldBounds)) {
      this.deleteFieldEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' fields by bounds');
}


// process deleted entity list and entity data
window.Render.prototype.processTileData = function(tiledata) {
  this.processDeletedGameEntityGuids(tiledata.deletedGameEntityGuids||[]);
  this.processGameEntities(tiledata.gameEntities||[]);
}


window.Render.prototype.processDeletedGameEntityGuids = function(deleted) {
  for(var i in deleted) {
    var guid = deleted[i];

    if ( !(guid in this.deletedGuid) ) {
      this.deletedGuid[guid] = true;  // flag this guid as having being processed

      if (guid == selectedPortal) {
        // the rare case of the selected portal being deleted. clear the details tab and deselect it
        renderPortalDetails(null);
      }

      this.deleteEntity(guid);

    }
  }

}

window.Render.prototype.processGameEntities = function(entities) {

  // we loop through the entities three times - for fields, links and portals separately
  // this is a reasonably efficient work-around for leafletjs limitations on svg render order


  for (var i in entities) {
    var ent = entities[i];
    if (ent[2][0] == 'r' && !(ent[0] in this.deletedGuid)) {
      this.createFieldEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2][0] == 'e' && !(ent[0] in this.deletedGuid)) {
      this.createLinkEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2][0] == 'p' && !(ent[0] in this.deletedGuid)) {
      this.createPortalEntity(ent);
    }
  }
}


// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {
  var countp=0,countl=0,countf=0;

  // check to see if there are any entities we haven't seen. if so, delete them
  for (var guid in window.portals) {
    // special case for selected portal - it's kept even if not seen
    // artifact (e.g. jarvis shard) portals are also kept - but they're always 'seen'
    if (!(guid in this.seenPortalsGuid) && guid !== selectedPortal) {
      this.deletePortalEntity(guid);
      countp++;
    }
  }
  for (var guid in window.links) {
    if (!(guid in this.seenLinksGuid)) {
      this.deleteLinkEntity(guid);
      countl++;
    }
  }
  for (var guid in window.fields) {
    if (!(guid in this.seenFieldsGuid)) {
      this.deleteFieldEntity(guid);
      countf++;
    }
  }

  console.log('Render: end cleanup: removed '+countp+' portals, '+countl+' links, '+countf+' fields');

  // reorder portals to be after links/fields
  this.bringPortalsToFront();

  this.isRendering = false;

  // re-select the selected portal, to re-render the side-bar. ensures that any data calculated from the map data is up to date
  if (selectedPortal) {
    renderPortalDetails (selectedPortal);
  }
}

window.Render.prototype.bringPortalsToFront = function() {
  for (var lvl in portalsFactionLayers) {
    // portals are stored in separate layers per faction
    // to avoid giving weight to one faction or another, we'll push portals to front based on GUID order
    var lvlPortals = {};
    for (var fac in portalsFactionLayers[lvl]) {
      var layer = portalsFactionLayers[lvl][fac];
      if (layer._map) {
        layer.eachLayer (function(p) {
          lvlPortals[p.options.guid] = p;
        });
      }
    }

    var guids = Object.keys(lvlPortals);
    guids.sort();

    for (var j in guids) {
      var guid = guids[j];
      lvlPortals[guid].bringToFront();
    }
  }

  // artifact portals are always brought to the front, above all others
  $.each(artifact.getInterestingPortals(), function(i,guid) {
    if (portals[guid] && portals[guid]._map) {
      portals[guid].bringToFront();
    }
  });

}


window.Render.prototype.deleteEntity = function(guid) {
  this.deletePortalEntity(guid);
  this.deleteLinkEntity(guid);
  this.deleteFieldEntity(guid);
}

window.Render.prototype.deletePortalEntity = function(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    window.ornaments.removePortal(p);
    this.removePortalFromMapLayer(p);
    delete window.portals[guid];
    window.runHooks('portalRemoved', {portal: p, data: p.options.data });
  }
}

window.Render.prototype.deleteLinkEntity = function(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    linksFactionLayers[l.options.team].removeLayer(l);
    delete window.links[guid];
    window.runHooks('linkRemoved', {link: l, data: l.options.data });
  }
}


window.Render.prototype.deleteFieldEntity = function(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    var fd = f.options.details;

    fieldsFactionLayers[f.options.team].removeLayer(f);
    delete window.fields[guid];
    window.runHooks('fieldRemoved', {field: f, data: f.options.data });
  }
}


window.Render.prototype.createPlaceholderPortalEntity = function(guid,latE6,lngE6,team) {
  // intel no longer returns portals at anything but the closest zoom
  // stock intel creates 'placeholder' portals from the data in links/fields - IITC needs to do the same
  // we only have the portal guid, lat/lng coords, and the faction - no other data
  // having the guid, at least, allows the portal details to be loaded once it's selected. however,
  // no highlighters, portal level numbers, portal names, useful counts of portals, etc are possible


  var ent = [
    guid,       //ent[0] = guid
    0,          //ent[1] = timestamp - zero will mean any other source of portal data will have a higher timestamp
                //ent[2] = an array with the entity data
    [ 'p',      //0 - a portal
      team,     //1 - team
      latE6,    //2 - lat
      lngE6     //3 - lng
    ]
  ];

  // placeholder portals don't have a useful timestamp value - so the standard code that checks for updated
  // portal details doesn't apply
  // so, check that the basic details are valid and delete the existing portal if out of date
  if (guid in window.portals) {
    var p = window.portals[guid];
    if (team != p.options.data.team || latE6 != p.options.data.latE6 || lngE6 != p.options.data.lngE6) {
      // team or location have changed - delete existing portal
      this.deletePortalEntity(guid);
    }
  }

  this.createPortalEntity(ent);

}


window.Render.prototype.createPortalEntity = function(ent) {
  this.seenPortalsGuid[ent[0]] = true;  // flag we've seen it

  var previousData = undefined;

  // check if entity already exists
  if (ent[0] in window.portals) {
    // yes. now check to see if the entity data we have is newer than that in place
    var p = window.portals[ent[0]];

    if (p.options.timestamp >= ent[1]) return; // this data is identical or older - abort processing

    // the data we have is newer. many data changes require re-rendering of the portal
    // (e.g. level changed, so size is different, or stats changed so highlighter is different)
    // so to keep things simple we'll always re-create the entity in this case

    // remember the old details, for the callback

    previousData = p.options.data;

    this.deletePortalEntity(ent[0]);
  }

  var portalLevel = parseInt(ent[2][4])||0;
  var team = teamStringToId(ent[2][1]);
  // the data returns unclaimed portals as level 1 - but IITC wants them treated as level 0
  if (team == TEAM_NONE) portalLevel = 0;

  var latlng = L.latLng(ent[2][2]/1E6, ent[2][3]/1E6);

  var data = decodeArray.portalSummary(ent[2]);

  var dataOptions = {
    level: portalLevel,
    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data
  };

  window.pushPortalGuidPositionCache(ent[0], data.latE6, data.lngE6);

  var marker = createMarker(latlng, dataOptions);

  marker.on('click', function() { window.renderPortalDetails(ent[0]); });
  marker.on('dblclick', function() { window.renderPortalDetails(ent[0]); window.map.setView(latlng, 17); });


  window.runHooks('portalAdded', {portal: marker, previousData: previousData});

  window.portals[ent[0]] = marker;

  // check for URL links to portal, and select it if this is the one
  if (urlPortalLL && urlPortalLL[0] == marker.getLatLng().lat && urlPortalLL[1] == marker.getLatLng().lng) {
    // URL-passed portal found via pll parameter - set the guid-based parameter
    console.log('urlPortalLL '+urlPortalLL[0]+','+urlPortalLL[1]+' matches portal GUID '+ent[0]);

    urlPortal = ent[0];
    urlPortalLL = undefined;  // clear the URL parameter so it's not matched again
  }
  if (urlPortal == ent[0]) {
    // URL-passed portal found via guid parameter - set it as the selected portal
    console.log('urlPortal GUID '+urlPortal+' found - selecting...');
    selectedPortal = ent[0];
    urlPortal = undefined;  // clear the URL parameter so it's not matched again
  }

  // (re-)select the portal, to refresh the sidebar on any changes
  if (ent[0] == selectedPortal) {
    console.log('portal guid '+ent[0]+' is the selected portal - re-rendering portal details');
    renderPortalDetails (selectedPortal);
  }

  window.ornaments.addPortal(marker);

  //TODO? postpone adding to the map layer
  this.addPortalToMapLayer(marker);

}


window.Render.prototype.createFieldEntity = function(ent) {
  this.seenFieldsGuid[ent[0]] = true;  // flag we've seen it

  var data = {
//    type: ent[2][0],
    team: ent[2][1],
    points: ent[2][2].map(function(arr) { return {guid: arr[0], latE6: arr[1], lngE6: arr[2] }; })
  };

  //create placeholder portals for field corners. we already do links, but there are the odd case where this is useful
  for (var i=0; i<3; i++) {
    var p=data.points[i];
    this.createPlaceholderPortalEntity(p.guid, p.latE6, p.lngE6, data.team);
  }

  // check if entity already exists
  if(ent[0] in window.fields) {
    // yes. in theory, we should never get updated data for an existing field. they're created, and they're destroyed - never changed
    // but theory and practice may not be the same thing...
    var f = window.fields[ent[0]];

    if (f.options.timestamp >= ent[1]) return; // this data is identical (or order) than that rendered - abort processing

    // the data we have is newer - two options
    // 1. just update the data, assume the field render appearance is unmodified
    // 2. delete the entity, then re-create with the new data
    this.deleteFieldEntity(ent[0]); // option 2, for now
  }

  var team = teamStringToId(ent[2][1]);
  var latlngs = [
    L.latLng(data.points[0].latE6/1E6, data.points[0].lngE6/1E6),
    L.latLng(data.points[1].latE6/1E6, data.points[1].lngE6/1E6),
    L.latLng(data.points[2].latE6/1E6, data.points[2].lngE6/1E6)
  ];

  var poly = L.geodesicPolygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,

    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data,
  });

  runHooks('fieldAdded',{field: poly});

  window.fields[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  fieldsFactionLayers[poly.options.team].addLayer(poly);
}

window.Render.prototype.createLinkEntity = function(ent,faked) {
  // Niantic have been faking link entities, based on data from fields
  // these faked links are sent along with the real portal links, causing duplicates
  // the faked ones all have longer GUIDs, based on the field GUID (with _ab, _ac, _bc appended)
  var fakedLink = new RegExp("^[0-9a-f]{32}\.b_[ab][bc]$"); //field GUIDs always end with ".b" - faked links append the edge identifier
  if (fakedLink.test(ent[0])) return;


  this.seenLinksGuid[ent[0]] = true;  // flag we've seen it

  var data = { // TODO add other properties and check correction direction
//    type:   ent[2][0],
    team:   ent[2][1],
    oGuid:  ent[2][2],
    oLatE6: ent[2][3],
    oLngE6: ent[2][4],
    dGuid:  ent[2][5],
    dLatE6: ent[2][6],
    dLngE6: ent[2][7]
  };

  // create placeholder entities for link start and end points (before checking if the link itself already exists
  this.createPlaceholderPortalEntity(data.oGuid, data.oLatE6, data.oLngE6, data.team);
  this.createPlaceholderPortalEntity(data.dGuid, data.dLatE6, data.dLngE6, data.team);


  // check if entity already exists
  if (ent[0] in window.links) {
    // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
    var l = window.links[ent[0]];

    // the faked data will have older timestamps than real data (currently, faked set to zero)
    if (l.options.timestamp >= ent[1]) return; // this data is older or identical to the rendered data - abort processing

    // the data is newer/better - two options
    // 1. just update the data. assume the link render appearance is unmodified
    // 2. delete the entity, then re-create it with the new data
    this.deleteLinkEntity(ent[0]); // option 2 - for now
  }

  var team = teamStringToId(ent[2][1]);
  var latlngs = [
    L.latLng(data.oLatE6/1E6, data.oLngE6/1E6),
    L.latLng(data.dLatE6/1E6, data.dLngE6/1E6)
  ];
  var poly = L.geodesicPolyline(latlngs, {
    color: COLORS[team],
    opacity: 1,
    weight: faked ? 1 : 2,
    clickable: false,

    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data
  });

  runHooks('linkAdded', {link: poly});

  window.links[ent[0]] = poly;

  linksFactionLayers[poly.options.team].addLayer(poly);
}



window.Render.prototype.rescalePortalMarkers = function() {
  if (this.portalMarkerScale === undefined || this.portalMarkerScale != portalMarkerScale()) {
    this.portalMarkerScale = portalMarkerScale();

    console.log('Render: map zoom '+map.getZoom()+' changes portal scale to '+portalMarkerScale()+' - redrawing all portals');

    //NOTE: we're not calling this because it resets highlights - we're calling it as it
    // resets the style (inc size) of all portal markers, applying the new scale
    resetHighlightedPortals();
  }
}



// add the portal to the visible map layer
window.Render.prototype.addPortalToMapLayer = function(portal) {
  portalsFactionLayers[parseInt(portal.options.level)||0][portal.options.team].addLayer(portal);
}

window.Render.prototype.removePortalFromMapLayer = function(portal) {
  //remove it from the portalsLevels layer
  portalsFactionLayers[parseInt(portal.options.level)||0][portal.options.team].removeLayer(portal);
}




;

// MAP DATA REQUEST ///////////////////////////////////////////////////
// class to request the map data tiles from the Ingress servers
// and then pass it on to the render class for display purposes
// Uses the map data cache class to reduce network requests


window.MapDataRequest = function() {
  this.cache = new DataCache();
  this.render = new Render();
  this.debugTiles = new RenderDebugTiles();

  this.activeRequestCount = 0;
  this.requestedTiles = {};

  this.renderQueue = [];
  this.renderQueueTimer = undefined;
  this.renderQueuePaused = false;

  this.idle = false;


  // no more than this many requests in parallel. stock site seems to rely on browser limits (6, usually), sending
  // many requests at once.
  // using our own queue limit ensures that other requests (e.g. chat, portal details) don't get delayed
  this.MAX_REQUESTS = 5;

  // this many tiles in one request
  this.NUM_TILES_PER_REQUEST = 25;

  // number of times to retry a tile after an error (including "error: TIMEOUT" now - as stock intel does)
  // TODO? different retry counters for TIMEOUT vs other errors..?
  this.MAX_TILE_RETRIES = 5;

  // refresh timers
  this.MOVE_REFRESH = 3; //time, after a map move (pan/zoom) before starting the refresh processing
  this.STARTUP_REFRESH = 3; //refresh time used on first load of IITC
  this.IDLE_RESUME_REFRESH = 5; //refresh time used after resuming from idle

  // after one of the above, there's an additional delay between preparing the refresh (clearing out of bounds,
  // processing cache, etc) and actually sending the first network requests
  this.DOWNLOAD_DELAY = 1;  //delay after preparing the data download before tile requests are sent


  // a short delay between one request finishing and the queue being run for the next request.
  this.RUN_QUEUE_DELAY = 0;

  // delay before processing the queue after failed requests
  this.BAD_REQUEST_RUN_QUEUE_DELAY = 5; // longer delay before doing anything after errors (other than TIMEOUT)

  // delay before processing the queue after empty responses
  this.EMPTY_RESPONSE_RUN_QUEUE_DELAY = 5; // also long delay - empty responses are likely due to some server issues

  // delay before processing the queue after error==TIMEOUT requests. this is 'expected', so minimal extra delay over the regular RUN_QUEUE_DELAY
  this.TIMEOUT_REQUEST_RUN_QUEUE_DELAY = 0;


  // render queue
  // number of items to process in each render pass. there are pros and cons to smaller and larger values
  // (however, if using leaflet canvas rendering, it makes sense to push as much as possible through every time)
  this.RENDER_BATCH_SIZE = L.Path.CANVAS ? 1E9 : 1500;

  // delay before repeating the render loop. this gives a better chance for user interaction
  this.RENDER_PAUSE = (typeof android === 'undefined') ? 0.1 : 0.2; //100ms desktop, 200ms mobile


  this.REFRESH_CLOSE = 300;  // refresh time to use for close views z>12 when not idle and not moving
  this.REFRESH_FAR = 900;  // refresh time for far views z <= 12
  this.FETCH_TO_REFRESH_FACTOR = 2;  //minumum refresh time is based on the time to complete a data fetch, times this value

  // ensure we have some initial map status
  this.setStatus ('startup', undefined, -1);

  // add a portalDetailLoaded hook, so we can use the exteneed details to update portals on the map
  var _this = this;
  addHook('portalDetailLoaded',function(data){
    _this.render.processGameEntities([data.ent]);
  });

}


window.MapDataRequest.prototype.start = function() {
  var savedContext = this;

  // setup idle resume function
  window.addResumeFunction ( function() { savedContext.idleResume(); } );

  // and map move start/end callbacks
  window.map.on('movestart', this.mapMoveStart, this);
  window.map.on('moveend', this.mapMoveEnd, this);


  // then set a timeout to start the first refresh
  this.refreshOnTimeout (this.STARTUP_REFRESH);
  this.setStatus ('refreshing', undefined, -1);

  this.cache && this.cache.startExpireInterval (15);
}


window.MapDataRequest.prototype.mapMoveStart = function() {
  console.log('refresh map movestart');

  this.setStatus('paused');
  this.clearTimeout();
  this.pauseRenderQueue(true);
}

window.MapDataRequest.prototype.mapMoveEnd = function() {
  var bounds = clampLatLngBounds(map.getBounds());
  var zoom = map.getZoom();

  if (this.fetchedDataParams) {
    // we have fetched (or are fetching) data...
    if (this.fetchedDataParams.mapZoom == map.getZoom() && this.fetchedDataParams.bounds.contains(bounds)) {
      // ... and the zoom level is the same and the current bounds is inside the fetched bounds
      // so, no need to fetch data. if there's time left, restore the original timeout

      var remainingTime = (this.timerExpectedTimeoutTime - new Date().getTime())/1000;

      if (remainingTime > this.MOVE_REFRESH) {
        this.setStatus('done','Map moved, but no data updates needed');
        this.refreshOnTimeout(remainingTime);
        this.pauseRenderQueue(false);
        return;
      }
    }
  }

  this.setStatus('refreshing', undefined, -1);
  this.refreshOnTimeout(this.MOVE_REFRESH);
}

window.MapDataRequest.prototype.idleResume = function() {
  // if we have no timer set and there are no active requests, refresh has gone idle and the timer needs restarting

  if (this.idle) {
    console.log('refresh map idle resume');
    this.idle = false;
    this.setStatus('idle restart', undefined, -1);
    this.refreshOnTimeout(this.IDLE_RESUME_REFRESH);
  }
}


window.MapDataRequest.prototype.clearTimeout = function() {

  if (this.timer) {
    console.log('cancelling existing map refresh timer');
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}

window.MapDataRequest.prototype.refreshOnTimeout = function(seconds) {
  this.clearTimeout();

  console.log('starting map refresh in '+seconds+' seconds');

  // 'this' won't be right inside the callback, so save it
  // also, double setTimeout used to ensure the delay occurs after any browser-related rendering/updating/etc
  var _this = this;
  this.timer = setTimeout ( function() {
    _this.timer = setTimeout ( function() { _this.timer = undefined; _this.refresh(); }, seconds*1000);
  }, 0);
  this.timerExpectedTimeoutTime = new Date().getTime() + seconds*1000;
}


window.MapDataRequest.prototype.setStatus = function(short,long,progress) {
  this.status = { short: short, long: long, progress: progress };
  window.renderUpdateStatus();
}


window.MapDataRequest.prototype.getStatus = function() {
  return this.status;
};


window.MapDataRequest.prototype.refresh = function() {

  // if we're idle, don't refresh
  if (window.isIdle()) {
    console.log('suspending map refresh - is idle');
    this.setStatus ('idle');
    this.idle = true;
    return;
  }

  //time the refresh cycle
  this.refreshStartTime = new Date().getTime();

  this.debugTiles.reset();
  this.resetRenderQueue();

  // a 'set' to keep track of hard failures for tiles
  this.tileErrorCount = {};

  // the 'set' of requested tile QKs
  // NOTE: javascript does not guarantee any order to properties of an object. however, in all major implementations
  // properties retain the order they are added in. IITC uses this to control the tile fetch order. if browsers change
  // then fetch order isn't optimal, but it won't break things.
  this.queuedTiles = {};


  var bounds = clampLatLngBounds(map.getBounds());
  var mapZoom = map.getZoom();

  var dataZoom = getDataZoomForMapZoom(mapZoom);

  var tileParams = getMapZoomTileParameters(dataZoom);


//DEBUG: resize the bounds so we only retrieve some data
//bounds = bounds.pad(-0.4);

//var debugrect = L.rectangle(bounds,{color: 'red', fill: false, weight: 4, opacity: 0.8}).addTo(map);
//setTimeout (function(){ map.removeLayer(debugrect); }, 10*1000);

  var x1 = lngToTile(bounds.getWest(), tileParams);
  var x2 = lngToTile(bounds.getEast(), tileParams);
  var y1 = latToTile(bounds.getNorth(), tileParams);
  var y2 = latToTile(bounds.getSouth(), tileParams);

  // calculate the full bounds for the data - including the part of the tiles off the screen edge
  var dataBounds = L.latLngBounds([
    [tileToLat(y2+1,tileParams), tileToLng(x1,tileParams)],
    [tileToLat(y1,tileParams), tileToLng(x2+1,tileParams)]
  ]);
//var debugrect2 = L.rectangle(dataBounds,{color: 'magenta', fill: false, weight: 4, opacity: 0.8}).addTo(map);
//setTimeout (function(){ map.removeLayer(debugrect2); }, 10*1000);

  // store the parameters used for fetching the data. used to prevent unneeded refreshes after move/zoom
  this.fetchedDataParams = { bounds: dataBounds, mapZoom: mapZoom, dataZoom: dataZoom };


  window.runHooks ('mapDataRefreshStart', {bounds: bounds, mapZoom: mapZoom, dataZoom: dataZoom, minPortalLevel: tileParams.level, tileBounds: dataBounds});

  this.render.startRenderPass(tileParams.level, dataBounds);

  var _render = this.render;
  window.runHooks ('mapDataEntityInject', {callback: function(ents) { _render.processGameEntities(ents);}});


  this.render.processGameEntities(artifact.getArtifactEntities());

  var logMessage = 'requesting data tiles at zoom '+dataZoom;
  if (tileParams.level != tileParams.maxLevel) {
    logMessage += ' (L'+tileParams.level+'+ portals - could have done L'+tileParams.maxLevel+'+';
  } else {
    logMessage += ' (L'+tileParams.level+'+ portals';
  }
  logMessage += ', '+tileParams.tilesPerEdge+' tiles per global edge), map zoom is '+mapZoom;

  console.log(logMessage);


  this.cachedTileCount = 0;
  this.requestedTileCount = 0;
  this.successTileCount = 0;
  this.failedTileCount = 0;
  this.staleTileCount = 0;

  var tilesToFetchDistance = {};

  // map center point - for fetching center tiles first
  var mapCenterPoint = map.project(map.getCenter(), mapZoom);

  // y goes from left to right
  for (var y = y1; y <= y2; y++) {
    // x goes from bottom to top(?)
    for (var x = x1; x <= x2; x++) {
      var tile_id = pointToTileId(tileParams, x, y);
      var latNorth = tileToLat(y,tileParams);
      var latSouth = tileToLat(y+1,tileParams);
      var lngWest = tileToLng(x,tileParams);
      var lngEast = tileToLng(x+1,tileParams);

      this.debugTiles.create(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);

//TODO: with recent backend changes there are now multiple zoom levels of data that is identical except perhaps for some
// reduction of detail when zoomed out. to take good advantage of the cache, a check for cached data at a closer zoom
// but otherwise the same parameters (min portal level, tiles per edge) will mean less downloads when zooming out
// (however, the default code in getDataZoomForMapZoom currently reduces the need for this, as it forces the furthest 
//  out zoom tiles for a detail level)
      if (this.cache && this.cache.isFresh(tile_id) ) {
        // data is fresh in the cache - just render it
        this.pushRenderQueue(tile_id,this.cache.get(tile_id),'cache-fresh');
        this.cachedTileCount += 1;
      } else {

        // no fresh data

        // tile needed. calculate the distance from the centre of the screen, to optimise the load order

        var latCenter = (latNorth+latSouth)/2;
        var lngCenter = (lngEast+lngWest)/2;
        var tileLatLng = L.latLng(latCenter,lngCenter);

        var tilePoint = map.project(tileLatLng, mapZoom);

        var delta = mapCenterPoint.subtract(tilePoint);
        var distanceSquared = delta.x*delta.x + delta.y*delta.y;

        tilesToFetchDistance[tile_id] = distanceSquared;
        this.requestedTileCount += 1;
      }
    }
  }

  // re-order the tile list by distance from the centre of the screen. this should load more relevant data first
  var tilesToFetch = Object.keys(tilesToFetchDistance);
  tilesToFetch.sort(function(a,b) {
    return tilesToFetchDistance[a]-tilesToFetchDistance[b];
  });

  for (var i in tilesToFetch) {
    var qk = tilesToFetch[i];

    this.queuedTiles[qk] = qk;
  }



  this.setStatus ('loading', undefined, -1);

  // technically a request hasn't actually finished - however, displayed portal data has been refreshed
  // so as far as plugins are concerned, it should be treated as a finished request
  window.runHooks('requestFinished', {success: true});

  console.log ('done request preparation (cleared out-of-bounds and invalid for zoom, and rendered cached data)');

  if (Object.keys(this.queuedTiles).length > 0) {
    // queued requests - don't start processing the download queue immediately - start it after a short delay
    this.delayProcessRequestQueue (this.DOWNLOAD_DELAY,true);
  } else {
    // all data was from the cache, nothing queued - run the queue 'immediately' so it handles the end request processing
    this.delayProcessRequestQueue (0,true);
  }
}


window.MapDataRequest.prototype.delayProcessRequestQueue = function(seconds,isFirst) {
  if (this.timer === undefined) {
    var _this = this;
    this.timer = setTimeout ( function() {
      _this.timer = setTimeout ( function() { _this.timer = undefined; _this.processRequestQueue(isFirst); }, seconds*1000 );
    }, 0);
  }
}


window.MapDataRequest.prototype.processRequestQueue = function(isFirstPass) {

  // if nothing left in the queue, finish
  if (Object.keys(this.queuedTiles).length == 0) {
    // we leave the renderQueue code to handle ending the render pass now
    // (but we need to make sure it's not left without it's timer running!)
    if (!this.renderQueuePaused) {
      this.startQueueTimer(this.RENDER_PAUSE);
    }

    return;
  }


  // create a list of tiles that aren't requested over the network
  var pendingTiles = [];
  for (var id in this.queuedTiles) {
    if (!(id in this.requestedTiles) ) {
      pendingTiles.push(id);
    }
  }

//  console.log('- request state: '+Object.keys(this.requestedTiles).length+' tiles in '+this.activeRequestCount+' active requests, '+pendingTiles.length+' tiles queued');

  var requestBuckets = this.MAX_REQUESTS - this.activeRequestCount;
  if (pendingTiles.length > 0 && requestBuckets > 0) {

    for (var bucket=0; bucket < requestBuckets; bucket++) {

      // if the tiles for this request have had several retries, use smaller requests
      // maybe some of the tiles caused all the others to error? no harm anyway, and it may help...
      var numTilesThisRequest = Math.min(this.NUM_TILES_PER_REQUEST,pendingTiles.length);

      var id = pendingTiles[0];
      var retryTotal = (this.tileErrorCount[id]||0);
      for (var i=1; i<numTilesThisRequest; i++) {
        id = pendingTiles[i];
        retryTotal += (this.tileErrorCount[id]||0);
        if (retryTotal > this.MAX_TILE_RETRIES) {
          numTilesThisRequest = i;
          break;
        }
      }

      var tiles = pendingTiles.splice(0, numTilesThisRequest);
      if (tiles.length > 0) {
        this.sendTileRequest(tiles);
      }
    }

  }


  // update status
  var pendingTileCount = this.requestedTileCount - (this.successTileCount+this.failedTileCount+this.staleTileCount);
  var longText = 'Tiles: ' + this.cachedTileCount + ' cached, ' +
                 this.successTileCount + ' loaded, ' +
                 (this.staleTileCount ? this.staleTileCount + ' stale, ' : '') +
                 (this.failedTileCount ? this.failedTileCount + ' failed, ' : '') +
                 pendingTileCount + ' remaining';

  progress = this.requestedTileCount > 0 ? (this.requestedTileCount-pendingTileCount) / this.requestedTileCount : undefined;
  this.setStatus ('loading', longText, progress);
}


window.MapDataRequest.prototype.sendTileRequest = function(tiles) {

  var tilesList = [];

  for (var i in tiles) {
    var id = tiles[i];

    this.debugTiles.setState (id, 'requested');

    this.requestedTiles[id] = true;

    if (id in this.queuedTiles) {
      tilesList.push (id);
    } else {
      console.warn('no queue entry for tile id '+id);
    }
  }

  var data = { tileKeys: tilesList };

  this.activeRequestCount += 1;

  var savedThis = this;

  // NOTE: don't add the request with window.request.add, as we don't want the abort handling to apply to map data any more
  window.postAjax('getEntities', data, 
    function(data, textStatus, jqXHR) { savedThis.handleResponse (data, tiles, true); },  // request successful callback
    function() { savedThis.handleResponse (undefined, tiles, false); }  // request failed callback
  );
}

window.MapDataRequest.prototype.requeueTile = function(id, error) {
  if (id in this.queuedTiles) {
    // tile is currently wanted...

    // first, see if the error can be ignored due to retry counts
    if (error) {
      this.tileErrorCount[id] = (this.tileErrorCount[id]||0)+1;
      if (this.tileErrorCount[id] <= this.MAX_TILE_RETRIES) {
        // retry limit low enough - clear the error flag
        error = false;
      }
    }

    if (error) {
      // if error is still true, retry limit hit. use stale data from cache if available
      var data = this.cache ? this.cache.get(id) : undefined;
      if (data) {
        // we have cached data - use it, even though it's stale
        this.pushRenderQueue(id,data,'cache-stale');
        this.staleTileCount += 1;
      } else {
        // no cached data
        this.debugTiles.setState (id, 'error');
        this.failedTileCount += 1;
      }
      // and delete from the pending requests...
      delete this.queuedTiles[id];

    } else {
      // if false, was a 'timeout' or we're retrying, so unlimited retries (as the stock site does)
      this.debugTiles.setState (id, 'retrying');

      // FIXME? it's nice to move retried tiles to the end of the request queue. however, we don't actually have a
      // proper queue, just an object with guid as properties. Javascript standards don't guarantee the order of properties
      // within an object. however, all current browsers do keep property order, and new properties are added at the end.
      // therefore, delete and re-add the requeued tile and it will be added to the end of the queue
      delete this.queuedTiles[id];
      this.queuedTiles[id] = id;

    }
  } // else the tile wasn't currently wanted (an old non-cancelled request) - ignore
}


window.MapDataRequest.prototype.handleResponse = function (data, tiles, success) {

  this.activeRequestCount -= 1;

  var successTiles = [];
  var errorTiles = [];
  var retryTiles = [];
  var timeoutTiles = [];
  var unaccountedTiles = tiles.slice(0); // Clone

  if (!success || !data || !data.result) {
    console.warn('Request.handleResponse: request failed - requeuing...'+(data && data.error?' error: '+data.error:''));

    //request failed - requeue all the tiles(?)

    if (data && data.error && data.error == 'RETRY') {
      // the server can sometimes ask us to retry a request. this is botguard related, I believe

      for (var i in tiles) {
        var id = tiles[i];
        retryTiles.push(id);
        this.debugTiles.setState (id, 'retrying');
      }

      window.runHooks('requestFinished', {success: false});

    } else {
      for (var i in tiles) {
        var id = tiles[i];
        errorTiles.push(id);
        this.debugTiles.setState (id, 'request-fail');
      }

      window.runHooks('requestFinished', {success: false});
    }
    unaccountedTiles = [];
  } else {

    // TODO: use result.minLevelOfDetail ??? stock site doesn't use it yet...

    var m = data.result.map;

    for (var id in m) {
      var val = m[id];
      unaccountedTiles.splice(unaccountedTiles.indexOf(id), 1);
      if ('error' in val) {
        // server returned an error for this individual data tile

        if (val.error == "TIMEOUT") {
          // TIMEOUT errors for individual tiles are quite common. used to be unlimited retries, but not any more
          timeoutTiles.push (id);
        } else {
          console.warn('map data tile '+id+' failed: error=='+val.error);
          errorTiles.push (id);
          this.debugTiles.setState (id, 'tile-fail');
        }
      } else {
        // no error for this data tile - process it
        successTiles.push (id);

        // store the result in the cache
        this.cache && this.cache.store (id, val);

        // if this tile was in the render list, render it
        // (requests aren't aborted when new requests are started, so it's entirely possible we don't want to render it!)
        if (id in this.queuedTiles) {

          this.pushRenderQueue(id,val,'ok');

          delete this.queuedTiles[id];
          this.successTileCount += 1;

        } // else we don't want this tile (from an old non-cancelled request) - ignore
      }

    }

    // TODO? check for any requested tiles in 'tiles' not being mentioned in the response - and handle as if it's a 'timeout'?


    window.runHooks('requestFinished', {success: true});
  }

  // set the queue delay based on any errors or timeouts
  // NOTE: retryTimes are retried at the regular delay - no longer wait as for error/timeout cases
  var nextQueueDelay = errorTiles.length > 0 ? this.BAD_REQUEST_RUN_QUEUE_DELAY :
                       unaccountedTiles.length > 0 ? this.EMPTY_RESPONSE_RUN_QUEUE_DELAY :
                       timeoutTiles.length > 0 ? this.TIMEOUT_REQUEST_RUN_QUEUE_DELAY :
                       this.RUN_QUEUE_DELAY;
  var statusMsg = 'getEntities status: '+tiles.length+' tiles: ';
  statusMsg += successTiles.length+' successful';
  if (retryTiles.length) statusMsg += ', '+retryTiles.length+' retried';
  if (timeoutTiles.length) statusMsg += ', '+timeoutTiles.length+' timed out';
  if (errorTiles.length) statusMsg += ', '+errorTiles.length+' failed';
  if (unaccountedTiles.length) statusMsg += ', '+unaccountedTiles.length+' unaccounted';
  statusMsg += '. delay '+nextQueueDelay+' seconds';
  console.log (statusMsg);


  // requeue any 'timeout' tiles immediately
  if (timeoutTiles.length > 0) {
    for (var i in timeoutTiles) {
      var id = timeoutTiles[i];
      delete this.requestedTiles[id];

      this.requeueTile(id, true);
    }
  }

  if (retryTiles.length > 0) {
    for (var i in retryTiles) {
      var id = retryTiles[i];
      delete this.requestedTiles[id];

      this.requeueTile(id, false);  //tiles from a error==RETRY request are requeued without counting it as an error
    }
  }

  if (errorTiles.length > 0) {
    for (var i in errorTiles) {
      var id = errorTiles[i];
      delete this.requestedTiles[id];
      this.requeueTile(id, true);
    }
  }

  if (unaccountedTiles.length > 0) {
    for (var i in unaccountedTiles) {
      var id = unaccountedTiles[i];
      delete this.requestedTiles[id];
      this.requeueTile(id, true);
    }
  }

  for (var i in successTiles) {
    var id = successTiles[i];
    delete this.requestedTiles[id];
  }


  this.delayProcessRequestQueue(nextQueueDelay);
}


window.MapDataRequest.prototype.resetRenderQueue = function() {
  this.renderQueue = [];

  if (this.renderQueueTimer) {
    clearTimeout(this.renderQueueTimer);
    this.renderQueueTimer = undefined;
  }
  this.renderQueuePaused = false;  
}


window.MapDataRequest.prototype.pushRenderQueue = function (id, data, status) {
  this.debugTiles.setState(id,'render-queue');
  this.renderQueue.push({
    id:id,
    // the data in the render queue is modified as we go, so we need to copy the values of the arrays. just storing the reference would modify the data in the cache!
    deleted: (data.deletedGameEntityGuids||[]).slice(0),
    entities: (data.gameEntities||[]).slice(0),
    status:status});

  if (!this.renderQueuePaused) {
    this.startQueueTimer(this.RENDER_PAUSE);
  }
}

window.MapDataRequest.prototype.startQueueTimer = function(delay) {
  if (this.renderQueueTimer === undefined) {
    var _this = this;
    this.renderQueueTimer = setTimeout( function() {
      _this.renderQueueTimer = setTimeout ( function() { _this.renderQueueTimer = undefined; _this.processRenderQueue(); }, (delay||0)*1000 );
    }, 0);
  }
}

window.MapDataRequest.prototype.pauseRenderQueue = function(pause) {
  this.renderQueuePaused = pause;
  if (pause) {
    if (this.renderQueueTimer) {
      clearTimeout(this.renderQueueTimer);
      this.renderQueueTimer = undefined;
    }
  } else {
    if (this.renderQueue.length > 0) {
      this.startQueueTimer(this.RENDER_PAUSE);
    }
  }
}

window.MapDataRequest.prototype.processRenderQueue = function() {
  var drawEntityLimit = this.RENDER_BATCH_SIZE;


//TODO: we don't take account of how many of the entities are actually new/removed - they
// could already be drawn and not changed. will see how it works like this...
  while (drawEntityLimit > 0 && this.renderQueue.length > 0) {
    var current = this.renderQueue[0];

    if (current.deleted.length > 0) {
      var deleteThisPass = current.deleted.splice(0,drawEntityLimit);
      drawEntityLimit -= deleteThisPass.length;
      this.render.processDeletedGameEntityGuids(deleteThisPass);
    }

    if (drawEntityLimit > 0 && current.entities.length > 0) {
      var drawThisPass = current.entities.splice(0,drawEntityLimit);
      drawEntityLimit -= drawThisPass.length;
      this.render.processGameEntities(drawThisPass);
    }

    if (current.deleted.length == 0 && current.entities.length == 0) {
      this.renderQueue.splice(0,1);
      this.debugTiles.setState(current.id, current.status);
    }


  }

  if (this.renderQueue.length > 0) {
    this.startQueueTimer(this.RENDER_PAUSE);
  } else if (Object.keys(this.queuedTiles).length == 0) {

    this.render.endRenderPass();

    var endTime = new Date().getTime();
    var duration = (endTime - this.refreshStartTime)/1000;

    console.log('finished requesting data! (took '+duration+' seconds to complete)');

    window.runHooks ('mapDataRefreshEnd', {});

    var longStatus = 'Tiles: ' + this.cachedTileCount + ' cached, ' +
                 this.successTileCount + ' loaded, ' +
                 (this.staleTileCount ? this.staleTileCount + ' stale, ' : '') +
                 (this.failedTileCount ? this.failedTileCount + ' failed, ' : '') +
                 'in ' + duration + ' seconds';

    // refresh timer based on time to run this pass, with a minimum of REFRESH seconds
    var minRefresh = map.getZoom()>12 ? this.REFRESH_CLOSE : this.REFRESH_FAR;
    var refreshTimer = Math.max(minRefresh, duration*this.FETCH_TO_REFRESH_FACTOR);
    this.refreshOnTimeout(refreshTimer);
    this.setStatus (this.failedTileCount ? 'errors' : this.staleTileCount ? 'out of date' : 'done', longStatus);

  }

}


;

/*
OMS doesn't cancel the original click event, so the topmost marker will get a click event while spiderfying.
Also, OMS only supports a global callback for all managed markers. Therefore, we will use a custom event that gets fired
for each marker.
*/

window.setupOMS = function() {
  window.oms = new OverlappingMarkerSpiderfier(map, {
    keepSpiderfied: true,
    legWeight: 3.5,
    legColors: {
      usual: '#FFFF00',
      highlighted: '#FF0000'
    }
  });

  window.oms.addListener('click', function(marker) {
    map.closePopup();
    marker.fireEvent('spiderfiedclick', {target: marker});
  });
  window.oms.addListener('spiderfy', function(markers) {
    map.closePopup();
  });
  map._container.addEventListener("keypress", function(ev) {
    if(ev.keyCode === 27) // Esc
      window.oms.unspiderfy();
  }, false);
}

window.registerMarkerForOMS = function(marker) {
  marker.on('add', function () {
    window.oms.addMarker(marker);
  });
  marker.on('remove', function () {
    window.oms.removeMarker(marker);
  });
  if(marker._map) // marker has already been added
    window.oms.addMarker(marker);
}




;

// ORNAMENTS ///////////////////////////////////////////////////////

// added as part of the ingress #helios in 2014, ornaments
// are additional image overlays for portals
// currently there are 28 known ornaments: ap$x$suffix
// - cluster portals (without suffix)
// - volatile portals (_v)
// - meeting points (_start)
// - finish points (_end)
// (there are 7 different colors for each of them)


window.ornaments = {}
window.ornaments.OVERLAY_SIZE = 60;
window.ornaments.OVERLAY_OPACITY = 0.6;

window.ornaments.setup = function() {
  window.ornaments._portals = {};
  window.ornaments._layer = L.layerGroup();
  window.addLayerGroup('Ornaments', window.ornaments._layer, true);
}

// quick test for portal having ornaments
window.ornaments.isInterestingPortal = function(portal) {
  return portal.options.data.ornaments.length != 0;
}

window.ornaments.addPortal = function(portal) {
  var guid = portal.options.guid;

  window.ornaments.removePortal(portal);

  var size = window.ornaments.OVERLAY_SIZE;
  var latlng = portal.getLatLng();

  if (portal.options.data.ornaments) {
    window.ornaments._portals[guid] = portal.options.data.ornaments.map(function(ornament) {
      var icon = L.icon({
        iconUrl: "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/"+ornament+".png",
        iconSize: [size, size],
        iconAnchor: [size/2,size/2],
        className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
      });

      return L.marker(latlng, {icon: icon, clickable: false, keyboard: false, opacity: window.ornaments.OVERLAY_OPACITY }).addTo(window.ornaments._layer);
    });
  }
}

window.ornaments.removePortal = function(portal) {
  var guid = portal.options.guid;
  if(window.ornaments._portals[guid]) {
    window.ornaments._portals[guid].forEach(function(marker) {
      window.ornaments._layer.removeLayer(marker);
    });
    delete window.ornaments._portals[guid];
  }
}


;

// created to start cleaning up "window" interaction
//

window.currentPane = '';

window.show = function(id) {
  if(window.currentPane == id) return;
  window.currentPane = id;
  window.hideall();

  runHooks("paneChanged", id);

  switch(id) {
    case 'all':
    case 'faction':
    case 'alerts':
      window.chat.show(id);
      break;
    case 'debug':
      window.debug.console.show();
      break;
    case 'map':
      window.smartphone.mapButton.click();
      $('#portal_highlight_select').show();
      $('#farm_level_select').show();
      break;
    case 'info':
      window.smartphone.sideButton.click();
      break;
  }

  if (typeof android !== 'undefined' && android && android.switchToPane) {
    android.switchToPane(id);
  }
}

window.hideall = function() {
  $('#chatcontrols, #chat, #chatinput, #sidebartoggle, #scrollwrapper, #updatestatus, #portal_highlight_select').hide();
  $('#farm_level_select').hide();
  $('#map').css('visibility', 'hidden');
  $('.ui-tooltip').remove();
}


;

// PLAYER NAMES //////////////////////////////////////////////////////



// test to see if a specific player GUID is a special system account (e.g. __JARVIS__, __ADA__) that shouldn't
// be listed as a player
window.isSystemPlayer = function(name) {

  switch (name) {
    case '__ADA__':
    case '__JARVIS__':
      return true;

    default:
      return false;
  }

}


;

/// PORTAL DATA TOOLS ///////////////////////////////////////////////////
// misc functions to get portal info

// search through the links data for all that link from or to a portal. returns an object with separate lists of in
// and out links. may or may not be as accurate as the portal details, depending on how much data the API returns
window.getPortalLinks = function(guid) {

  var links = { in: [], out: [] };

  $.each(window.links, function(g,l) {
    var d = l.options.data;

    if (d.oGuid == guid) {
      links.out.push(g);
    }
    if (d.dGuid == guid) {
      links.in.push(g);
    }
  });

  return links;
}

window.getPortalLinksCount = function(guid) {
  var links = getPortalLinks(guid);
  return links.in.length+links.out.length;
}


// search through the fields for all that reference a portal
window.getPortalFields = function(guid) {
  var fields = [];

  $.each(window.fields, function(g,f) {
    var d = f.options.data;

    if ( d.points[0].guid == guid
      || d.points[1].guid == guid
      || d.points[2].guid == guid ) {

      fields.push(g);
    }
  });

  return fields;
}

window.getPortalFieldsCount = function(guid) {
  var fields = getPortalFields(guid);
  return fields.length;
}


// find the lat/lon for a portal, using any and all available data
// (we have the list of portals, the cached portal details, plus links and fields as sources of portal locations)
window.findPortalLatLng = function(guid) {
  if (window.portals[guid]) {
    return window.portals[guid].getLatLng();
  }

  // not found in portals - try the cached (and possibly stale) details - good enough for location
  var details = portalDetail.get(guid);
  if (details) {
    return L.latLng (details.latE6/1E6, details.lngE6/1E6);
  }

  // now try searching through fields
  for (var fguid in window.fields) {
    var f = window.fields[fguid].options.data;

    for (var i in f.points) {
      if (f.points[i].guid == guid) {
        return L.latLng (f.points[i].latE6/1E6, f.points[i].lngE6/1E6);
      }
    }
  }

  // and finally search through links
  for (var lguid in window.links) {
    var l = window.links[lguid].options.data;
    if (l.oGuid == guid) {
      return L.latLng (l.oLatE6/1E6, l.oLngE6/1E6);
    }
    if (l.dGuid == guid) {
      return L.latLng (l.dLatE6/1E6, l.dLngE6/1E6);
    }
  }

  // no luck finding portal lat/lng
  return undefined;
};


(function() {
  var cache = {};
  var cache_level = 0;
  var GC_LIMIT = 15000; // run garbage collector when cache has more that 5000 items
  var GC_KEEP  = 10000; // keep the 4000 most recent items

  window.findPortalGuidByPositionE6 = function(latE6, lngE6) {
    var item = cache[latE6+","+lngE6];
    if(item) return item[0];

    // now try searching through currently rendered portals
    for(var guid in window.portals) {
      var data = window.portals[guid].options.data;
      if(data.latE6 == latE6 && data.lngE6 == lngE6) return guid;
    }

    // now try searching through fields
    for(var fguid in window.fields) {
      var points = window.fields[fguid].options.data.points;

      for(var i in points) {
        var point = points[i];
        if(point.latE6 == latE6 && point.lngE6 == lngE6) return point.guid;
      }
    }

    // and finally search through links
    for(var lguid in window.links) {
      var l = window.links[lguid].options.data;
      if(l.oLatE6 == latE6 && l.oLngE6 == lngE6) return l.oGuid;
      if(l.dLatE6 == latE6 && l.dLngE6 == lngE6) return l.dGuid;
    }

    return null;
  };

  window.pushPortalGuidPositionCache = function(guid, latE6, lngE6) {
    cache[latE6+","+lngE6] = [guid, Date.now()];
    cache_level += 1;

    if(cache_level > GC_LIMIT) {
      Object.keys(cache) // get all latlngs
        .map(function(latlng) { return [latlng, cache[latlng][1]]; })  // map them to [latlng, timestamp]
        .sort(function(a,b) { return b[1] - a[1]; }) // sort them
        .slice(GC_KEEP) // drop the MRU
        .forEach(function(item) { delete cache[item[0]] }); // delete the rest
      cache_level = Object.keys(cache).length
    }
  }
})();


// get the AP gains from a portal, based only on the brief summary data from portals, links and fields
// not entirely accurate - but available for all portals on the screen
window.getPortalApGain = function(guid) {

  var p = window.portals[guid];
  if (p) {
    var data = p.options.data;

    var linkCount = getPortalLinksCount(guid);
    var fieldCount = getPortalFieldsCount(guid);

    var result = portalApGainMaths(data.resCount, linkCount, fieldCount);
    return result;
  }

  return undefined;
}

// given counts of resonators, links and fields, calculate the available AP
// doesn't take account AP for resonator upgrades or AP for adding mods
window.portalApGainMaths = function(resCount, linkCount, fieldCount) {

  var deployAp = (8-resCount)*DEPLOY_RESONATOR;
  if (resCount == 0) deployAp += CAPTURE_PORTAL;
  if (resCount != 8) deployAp += COMPLETION_BONUS;
  // there could also be AP for upgrading existing resonators, and for deploying mods - but we don't have data for that
  var friendlyAp = deployAp;

  var destroyResoAp = resCount*DESTROY_RESONATOR;
  var destroyLinkAp = linkCount*DESTROY_LINK;
  var destroyFieldAp = fieldCount*DESTROY_FIELD;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var destroyAp = destroyResoAp+destroyLinkAp+destroyFieldAp;
  var enemyAp = destroyAp+captureAp;

  return {
    friendlyAp: friendlyAp,
    enemyAp: enemyAp,
    destroyAp: destroyAp,
    destroyResoAp: destroyResoAp,
    captureAp: captureAp
  }
}


;

/// PORTAL DETAIL //////////////////////////////////////
// code to retrieve the new portal detail data from the servers

// NOTE: the API for portal detailed information is NOT FINAL
// this is a temporary measure to get things working again after a major change to the intel map
// API. expect things to change here


// anonymous function wrapper for the code - any variables/functions not placed into 'window' will be private
(function(){

var cache;
var requestQueue = {};

window.portalDetail = function() {};

window.portalDetail.setup = function() {
  cache = new DataCache();

  cache.startExpireInterval(20);
}

window.portalDetail.get = function(guid) {
  return cache.get(guid);
}

window.portalDetail.isFresh = function(guid) {
  return cache.isFresh(guid);
}


var handleResponse = function(guid, data, success) {
  delete requestQueue[guid];

  if (!data || data.error || !data.result) {
    success = false;
  }

  if (success) {

    var dict = decodeArray.portalDetail(data.result);

    // entity format, as used in map data
    var ent = [guid,dict.timestamp,data.result];

    cache.store(guid,dict);

    //FIXME..? better way of handling sidebar refreshing...

    if (guid == selectedPortal) {
      renderPortalDetails(guid);
    }

    window.runHooks ('portalDetailLoaded', {guid:guid, success:success, details:dict, ent:ent});

  } else {
    if (data && data.error == "RETRY") {
      // server asked us to try again
      portalDetail.request(guid);
    } else {
      window.runHooks ('portalDetailLoaded', {guid:guid, success:success});
    }
  }

}

window.portalDetail.request = function(guid) {
  if (!requestQueue[guid]) {
    requestQueue[guid] = true;

    window.postAjax('getPortalDetails', {guid:guid},
      function(data,textStatus,jqXHR) { handleResponse(guid, data, true); },
      function() { handleResponse(guid, undefined, false); }
    );
  }

}



})(); // anonymous wrapper function end




;

// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.renderPortalDetails = function(guid) {
  selectPortal(window.portals[guid] ? guid : null);

  if (guid && !portalDetail.isFresh(guid)) {
    portalDetail.request(guid);
  }

  // TODO? handle the case where we request data for a particular portal GUID, but it *isn't* in
  // window.portals....

  if(!window.portals[guid]) {
    urlPortal = guid;
    $('#portaldetails').html('');
    if(isSmartphone()) {
      $('.fullimg').remove();
      $('#mobileinfo').html('<div style="text-align: center"><b>tap here for info screen</b></div>');
    }
    return;
  }

  var portal = window.portals[guid];
  var data = portal.options.data;
  var details = portalDetail.get(guid);

  // details and data can get out of sync. if we have details, construct a matching 'data'
  if (details) {
    data = getPortalSummaryData(details);
  }


  var modDetails = details ? '<div class="mods">'+getModDetails(details)+'</div>' : '';
  var miscDetails = details ? getPortalMiscDetails(guid,details) : '';
  var resoDetails = details ? getResonatorDetails(details) : '';

//TODO? other status details...
  var statusDetails = details ? '' : '<div id="portalStatus">Loading details...</div>';
 

  var img = fixPortalImageUrl(details ? details.image : data.image);
  var title = (details && details.title) || (data && data.title) || 'null';

  var lat = data.latE6/1E6;
  var lng = data.lngE6/1E6;

  var imgTitle = title+'\n\nClick to show full image.';


  // portal level. start with basic data - then extend with fractional info in tooltip if available
  var levelInt = (teamStringToId(data.team) == TEAM_NONE) ? 0 : data.level;
  var levelDetails = levelInt;
  if (details) {
    levelDetails = getPortalLevel(details);
    if(levelDetails != 8) {
      if(levelDetails==Math.ceil(levelDetails))
        levelDetails += "\n8";
      else
        levelDetails += "\n" + (Math.ceil(levelDetails) - levelDetails)*8;
      levelDetails += " resonator level(s) needed for next portal level";
    } else {
      levelDetails += "\nfully upgraded";
    }
  }
  levelDetails = "Level " + levelDetails;


  var linkDetails = [];

  var posOnClick = 'window.showPortalPosLinks('+lat+','+lng+',\''+escapeJavascriptString(title)+'\')';
  var permalinkUrl = '/intel?ll='+lat+','+lng+'&z=17&pll='+lat+','+lng;

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    // android devices. one share link option - and the android app provides an interface to share the URL,
    // share as a geo: intent (navigation via google maps), etc

    var shareLink = $('<div>').html( $('<a>').attr({onclick:posOnClick}).text('Share portal') ).html();
    linkDetails.push('<aside>'+shareLink+'</aside>');

  } else {
    // non-android - a permalink for the portal
    var permaHtml = $('<div>').html( $('<a>').attr({href:permalinkUrl, title:'Create a URL link to this portal'}).text('Portal link') ).html();
    linkDetails.push ( '<aside>'+permaHtml+'</aside>' );

    // and a map link popup dialog
    var mapHtml = $('<div>').html( $('<a>').attr({onclick:posOnClick, title:'Link to alternative maps (Google, etc)'}).text('Map links') ).html();
    linkDetails.push('<aside>'+mapHtml+'</aside>');

  }

  $('#portaldetails')
    .html('') //to ensure it's clear
    .attr('class', TEAM_TO_CSS[teamStringToId(data.team)])
    .append(
      $('<h3>').attr({class:'title'}).text(title),

      $('<span>').attr({
        class: 'close',
        title: 'Close [w]',
        onclick:'renderPortalDetails(null); if(isSmartphone()) show("map");',
        accesskey: 'w'
      }).text('X'),

      // help cursor via ".imgpreview img"
      $('<div>')
      .attr({class:'imgpreview', title:imgTitle, style:"background-image: url('"+img+"')"})
      .append(
        $('<span>').attr({id:'level', title: levelDetails}).text(levelInt),
        $('<img>').attr({class:'hide', src:img})
      ),

      modDetails,
      miscDetails,
      resoDetails,
      statusDetails,
      '<div class="linkdetails">' + linkDetails.join('') + '</div>'
    );

  // only run the hooks when we have a portalDetails object - most plugins rely on the extended data
  // TODO? another hook to call always, for any plugins that can work with less data?
  if (details) {
    runHooks('portalDetailsUpdated', {guid: guid, portal: portal, portalDetails: details, portalData: data});
  }
}



window.getPortalMiscDetails = function(guid,d) {

  var randDetails;

  if (d) {

    // collect some random data that’s not worth to put in an own method
    var linkInfo = getPortalLinks(guid);
    var maxOutgoing = getMaxOutgoingLinks(d);
    var linkCount = linkInfo.in.length + linkInfo.out.length;
    var links = {incoming: linkInfo.in.length, outgoing: linkInfo.out.length};

    var title = 'at most ' + maxOutgoing + ' outgoing links\n' +
                links.outgoing + ' links out\n' +
                links.incoming + ' links in\n' +
                '(' + (links.outgoing+links.incoming) + ' total)'
    var linksText = ['links', links.outgoing+' out / '+links.incoming+' in', title];

    var player = d.owner
      ? '<span class="nickname">' + d.owner + '</span>'
      : '-';
    var playerText = ['owner', player];


    var fieldCount = getPortalFieldsCount(guid);

    var fieldsText = ['fields', fieldCount];

    var apGainText = getAttackApGainText(d,fieldCount,linkCount);

    var attackValues = getPortalAttackValues(d);


    // collect and html-ify random data

    var randDetailsData = [
      // these pieces of data are only relevant when the portal is captured
      // maybe check if portal is captured and remove?
      // But this makes the info panel look rather empty for unclaimed portals
      playerText, getRangeText(d),
      linksText, fieldsText,
      getMitigationText(d,linkCount), getEnergyText(d),
      // and these have some use, even for uncaptured portals
      apGainText, getHackDetailsText(d),
    ];

    if(attackValues.attack_frequency != 0)
      randDetailsData.push([
        '<span title="attack frequency" class="text-overflow-ellipsis">attack frequency</span>',
        '×'+attackValues.attack_frequency]);
    if(attackValues.hit_bonus != 0)
      randDetailsData.push(['hit bonus', attackValues.hit_bonus+'%']);
    if(attackValues.force_amplifier != 0)
      randDetailsData.push([
        '<span title="force amplifier" class="text-overflow-ellipsis">force amplifier</span>',
        '×'+attackValues.force_amplifier]);

    randDetails = '<table id="randdetails">' + genFourColumnTable(randDetailsData) + '</table>';


    // artifacts - tacked on after (but not as part of) the 'randdetails' table
    // instead of using the existing columns....

    if (d.artifactBrief && d.artifactBrief.target && Object.keys(d.artifactBrief.target).length > 0) {
      var targets = Object.keys(d.artifactBrief.target);
//currently (2015-07-10) we no longer know the team each target portal is for - so we'll just show the artifact type(s) 
       randDetails += '<div id="artifact_target">Target portal: '+targets.map(function(x) { return x.capitalize(); }).join(', ')+'</div>';
    }

    // shards - taken directly from the portal details
    if (d.artifactDetail) {
      randDetails += '<div id="artifact_fragments">Shards: '+d.artifactDetail.displayName+' #'+d.artifactDetail.fragments.join(', ')+'</div>';
    }

  }

  return randDetails;
}


// draws link-range and hack-range circles around the portal with the
// given details. Clear them if parameter 'd' is null.
window.setPortalIndicators = function(p) {

  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  portalRangeIndicator = null;
  if(portalAccessIndicator) map.removeLayer(portalAccessIndicator);
  portalAccessIndicator = null;

  // if we have a portal...

  if(p) {
    var coord = p.getLatLng();

    // range is only known for sure if we have portal details
    // TODO? render a min range guess until details are loaded..?

    var d = portalDetail.get(p.options.guid);
    if (d) {
      var range = getPortalRange(d);
      portalRangeIndicator = (range.range > 0
          ? L.geodesicCircle(coord, range.range, {
              fill: false,
              color: RANGE_INDICATOR_COLOR,
              weight: 3,
              dashArray: range.isLinkable ? undefined : "10,10",
              clickable: false })
          : L.circle(coord, range.range, { fill: false, stroke: false, clickable: false })
        ).addTo(map);
    }

    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, clickable: false }
    ).addTo(map);
  }

}

// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it's still the same portal that just needs an
// update.
window.selectPortal = function(guid) {
  var update = selectedPortal === guid;
  var oldPortalGuid = selectedPortal;
  selectedPortal = guid;

  var oldPortal = portals[oldPortalGuid];
  var newPortal = portals[guid];

  // Restore style of unselected portal
  if(!update && oldPortal) setMarkerStyle(oldPortal,false);

  // Change style of selected portal
  if(newPortal) {
    setMarkerStyle(newPortal, true);

    if (map.hasLayer(newPortal)) {
      newPortal.bringToFront();
    }
  }

  setPortalIndicators(newPortal);

  runHooks('portalSelected', {selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid});
  return update;
}


;

// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  
  var title = 'Base range:\t' + digits(Math.floor(range.base))+'m'
    + '\nLink amp boost:\t×'+range.boost
    + '\nRange:\t'+digits(Math.floor(range.range))+'m';
  
  if(!range.isLinkable) title += '\nPortal is missing resonators,\nno new links can be made';
  
  return ['range',
      '<a onclick="window.rangeLinkClick()"'
    + (range.isLinkable ? '' : ' style="text-decoration:line-through;"')
    + '>'
    + (range.range > 1000
      ? Math.floor(range.range/1000) + ' km'
      : Math.floor(range.range)      + ' m')
    + '</a>',
    title];
}


// given portal details, returns html code to display mod details.
window.getModDetails = function(d) {
  var mods = [];
  var modsTitle = [];
  var modsColor = [];
  $.each(d.mods, function(ind, mod) {
    var modName = '';
    var modTooltip = '';
    var modColor = '#000';

    if (mod) {
      // all mods seem to follow the same pattern for the data structure
      // but let's try and make this robust enough to handle possible future differences

      modName = mod.name || '(unknown mod)';

      if (mod.rarity) {
        modName = mod.rarity.capitalize().replace(/_/g,' ') + ' ' + modName;
      }

      modTooltip = modName + '\n';
      if (mod.owner) {
        modTooltip += 'Installed by: '+ mod.owner + '\n';
      }

      if (mod.stats) {
        modTooltip += 'Stats:';
        for (var key in mod.stats) {
          if (!mod.stats.hasOwnProperty(key)) continue;
          var val = mod.stats[key];

          // if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

          // special formatting for known mod stats, where the display of the raw value is less useful
          if      (key === 'HACK_SPEED')            val = (val/10000)+'%'; // 500000 = 50%
          else if (key === 'HIT_BONUS')             val = (val/10000)+'%'; // 300000 = 30%
          else if (key === 'ATTACK_FREQUENCY')      val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'FORCE_AMPLIFIER')       val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'LINK_RANGE_MULTIPLIER') val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'LINK_DEFENSE_BOOST')    val = (val/1000) +'x'; // 1500 = 1.5x
          else if (key === 'REMOVAL_STICKINESS' && val > 100) val = (val/10000)+'%'; // an educated guess
          // else display unmodified. correct for shield mitigation and multihack - unknown for future/other mods

          modTooltip += '\n+' +  val + ' ' + key.capitalize().replace(/_/g,' ');
        }
      }

      if (mod.rarity) {
        modColor = COLORS_MOD[mod.rarity];
      } else {
        modColor = '#fff';
      }
    }

    mods.push(modName);
    modsTitle.push(modTooltip);
    modsColor.push(modColor);
  });


  var t = '';
  for (var i=0; i<mods.length; i++) {
    t += '<span'+(modsTitle[i].length ? ' title="'+modsTitle[i]+'"' : '')+' style="color:'+modsColor[i]+'">'+mods[i]+'</span>'
  }
  // and add blank entries if we have less than 4 mods (as the server no longer returns all mod slots, but just the filled ones)
  for (var i=mods.length; i<4; i++) {
    t += '<span style="color:#000"></span>'
  }

  return t;
}

window.getEnergyText = function(d) {
  var currentNrg = getCurrentPortalEnergy(d);
  var totalNrg = getTotalPortalEnergy(d);
  var title = currentNrg + ' / ' + totalNrg;
  var fill = prettyEnergy(currentNrg) + ' / ' + prettyEnergy(totalNrg)
  return ['energy', fill, title];
}


window.getResonatorDetails = function(d) {
  var resoDetails = [];
  // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
  // resos in the display should be ordered like this:
  //   N    NE         Since the view is displayed in rows, they
  //  NW    E          need to be ordered like this: N NE NW E W SE SW S
  //   W    SE         i.e. 2 1 3 0 4 7 5 6
  //  SW    S
  // note: as of 2014-05-23 update, this is not true for portals with empty slots!

  var processResonatorSlot = function(reso,slot) {
    var lvl=0, nrg=0, owner=null;

    if (reso) {
      lvl = parseInt(reso.level);
      nrg = parseInt(reso.energy);
      owner = reso.owner;
    }

    resoDetails.push(renderResonatorDetails(slot, lvl, nrg, owner));
  };


  // if all 8 resonators are deployed, we know which is in which slot

  if (d.resonators.length == 8) {
    // fully deployed - we can make assumptions about deployment slots
    $.each([2, 1, 3, 0, 4, 7, 5, 6], function(ind, slot) {
      processResonatorSlot(d.resonators[slot],slot);
    });
  } else {
    // partially deployed portal - we can no longer find out which resonator is in which slot
    for(var ind=0; ind<8; ind++) {
      processResonatorSlot(ind < d.resonators.length ? d.resonators[ind] : null, null);
    }

  }

  return '<table id="resodetails">' + genFourColumnTable(resoDetails) + '</table>';

}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, nick) {
  if(OCTANTS[slot] === 'N')
    var className = 'meter north';
  else
    var className = 'meter';

  var max = RESO_NRG[level];
  var fillGrade = level > 0 ? nrg/max*100 : 0;

  var inf = (level > 0 ? 'energy:\t' + nrg   + ' / ' + max + ' (' + Math.round(fillGrade) + '%)\n'
                        +'level:\t'  + level + '\n'
                        +'owner:\t'  + nick  + '\n'
                       : '')
          + (slot !== null ? 'octant:\t' + OCTANTS[slot] + ' ' + OCTANTS_ARROW[slot]:'');

  var style = fillGrade ? 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+';':'';

  var color = (level < 3 ? "#9900FF" : "#FFFFFF");

  var lbar = level > 0 ? '<span class="meter-level" style="color: ' + color + ';"> L ' + level + ' </span>' : '';

  var fill  = '<span style="'+style+'"></span>';

  var meter = '<span class="' + className + '" title="'+inf+'">' + fill + lbar + '</span>';

  nick = nick ? '<span class="nickname">'+nick+'</span>' : null;
  return [meter, nick || ''];
}

// calculate AP gain from destroying portal and then capturing it by deploying resonators
window.getAttackApGainText = function(d,fieldCount,linkCount) {
  var breakdown = getAttackApGain(d,fieldCount,linkCount);
  var totalGain = breakdown.enemyAp;

  var t = '';
  if (teamStringToId(PLAYER.team) == teamStringToId(d.team)) {
    totalGain = breakdown.friendlyAp;
    t += 'Friendly AP:\t' + breakdown.friendlyAp + '\n';
    t += '  Deploy ' + breakdown.deployCount + ', ';
    t += 'Upgrade ' + breakdown.upgradeCount + '\n';
    t += '\n';
  }
  t += 'Enemy AP:\t' + breakdown.enemyAp + '\n';
  t += '  Destroy AP:\t' + breakdown.destroyAp + '\n';
  t += '  Capture AP:\t' + breakdown.captureAp + '\n';

  return ['AP Gain', digits(totalGain), t];
}


window.getHackDetailsText = function(d) {
  var hackDetails = getPortalHackDetails(d);

  var shortHackInfo = hackDetails.hacks+' @ '+formatInterval(hackDetails.cooldown);

  var title = 'Hacks available every 4 hours\n'
            + 'Hack count:\t'+hackDetails.hacks+'\n'
            + 'Cooldown time:\t'+formatInterval(hackDetails.cooldown)+'\n'
            + 'Burnout time:\t'+formatInterval(hackDetails.burnout);

  return ['hacks', shortHackInfo, title];
}


window.getMitigationText = function(d,linkCount) {
  var mitigationDetails = getPortalMitigationDetails(d,linkCount);

  var mitigationShort = mitigationDetails.total;
  if (mitigationDetails.excess) mitigationShort += ' (+'+mitigationDetails.excess+')';

  var title = 'Total shielding:\t'+(mitigationDetails.shields+mitigationDetails.links)+'\n'
            + '- active:\t'+mitigationDetails.total+'\n'
            + '- excess:\t'+mitigationDetails.excess+'\n'
            + 'From\n'
            + '- shields:\t'+mitigationDetails.shields+'\n'
            + '- links:\t'+mitigationDetails.links;

  return ['shielding', mitigationShort, title];
}


;

// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters

// an object mapping highlighter names to the object containing callback functions
window._highlighters = null;

// the name of the current highlighter
window._current_highlighter = localStorage.portal_highlighter;

window._no_highlighter = 'No Highlights';


window.addPortalHighlighter = function(name, data) {
  if(_highlighters === null) {
    _highlighters = {};
  }

  // old-format highlighters just passed a callback function. this is the same as just a highlight method
  if (!data.highlight) {
    data = {highlight: data}
  }

  _highlighters[name] = data;

  if (typeof android !== 'undefined' && android && android.addPortalHighlighter)
    android.addPortalHighlighter(name);

  if(window._current_highlighter === undefined) {
    _current_highlighter = name;
  }

  if (_current_highlighter == name) {
    if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
      android.setActiveHighlighter(name);

    // call the setSelected callback 
    if (_highlighters[_current_highlighter].setSelected) {
      _highlighters[_current_highlighter].setSelected(true);
    }

  }
  updatePortalHighlighterControl();
}

// (re)creates the highlighter dropdown list
window.updatePortalHighlighterControl = function() {
  if (typeof android !== 'undefined' && android && android.addPortalHighlighter) {
    $('#portal_highlight_select').remove();
    return;
  }

  if(_highlighters !== null) {
    if($('#portal_highlight_select').length === 0) {
      $("body").append("<select id='portal_highlight_select'></select>");
      $("#portal_highlight_select").change(function(){ changePortalHighlights($(this).val());});
      $(".leaflet-top.leaflet-left").css('padding-top', '20px');
      $(".leaflet-control-scale-line").css('margin-top','25px');
    }
    $("#portal_highlight_select").html('');
    $("#portal_highlight_select").append($("<option>").attr('value',_no_highlighter).text(_no_highlighter));
    var h_names = Object.keys(_highlighters).sort();
    
    $.each(h_names, function(i, name) {  
      $("#portal_highlight_select").append($("<option>").attr('value',name).text(name));
    });

    $("#portal_highlight_select").val(_current_highlighter);
  }
}

window.changePortalHighlights = function(name) {

  // first call any previous highlighter select callback
  if (_current_highlighter && _highlighters[_current_highlighter] && _highlighters[_current_highlighter].setSelected) {
    _highlighters[_current_highlighter].setSelected(false);
  }

  _current_highlighter = name;
  if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
    android.setActiveHighlighter(name);

  // now call the setSelected callback for the new highlighter
  if (_current_highlighter && _highlighters[_current_highlighter] && _highlighters[_current_highlighter].setSelected) {
    _highlighters[_current_highlighter].setSelected(true);
  }

  resetHighlightedPortals();
  localStorage.portal_highlighter = name;
}

window.highlightPortal = function(p) {
  
  if(_highlighters !== null && _highlighters[_current_highlighter] !== undefined) {
    _highlighters[_current_highlighter].highlight({portal: p});
  }
}

window.resetHighlightedPortals = function() {
  $.each(portals, function(guid, portal) {
    setMarkerStyle(portal, guid === selectedPortal);
  });
}


;

// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.

// returns a float. Displayed portal level is always rounded down from
// that value.
window.getPortalLevel = function(d) {
  var lvl = 0;
  var hasReso = false;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    lvl += parseInt(reso.level);
    hasReso = true;
  });
  return hasReso ? Math.max(1, lvl/8) : 0;
}

window.getTotalPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    var level = parseInt(reso.level);
    var max = RESO_NRG[level];
    nrg += max;
  });
  return nrg;
}

// For backwards compatibility
window.getPortalEnergy = window.getTotalPortalEnergy;

window.getCurrentPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    nrg += parseInt(reso.energy);
  });
  return nrg;
}

window.getPortalRange = function(d) {
  // formula by the great gals and guys at
  // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/

  var lvl = 0;
  var resoMissing = false;
  // currently we get a short resonator array when some are missing
  if (d.resonators.length < 8) {
    resoMissing = true;
  }
  // but in the past we used to always get an array of 8, but will 'null' objects for some entries. maybe that will return?
  $.each(d.resonators, function(ind, reso) {
    if(!reso) {
      resoMissing = true;
      return;
    }
  });

  var range = {
    base: 160*Math.pow(getPortalLevel(d), 4),
    boost: getLinkAmpRangeBoost(d)
  };

  range.range = range.boost * range.base;
  range.isLinkable = !resoMissing;

  return range;
}

window.getLinkAmpRangeBoost = function(d) {
  // additional range boost calculation

  // link amps scale: first is full, second a quarter, the last two an eighth
  var scale = [1.0, 0.25, 0.125, 0.125];

  var boost = 0.0;  // initial boost is 0.0 (i.e. no boost over standard range)

  var linkAmps = getPortalModsByType(d, 'LINK_AMPLIFIER');

  linkAmps.forEach(function(mod, i) {
    // link amp stat LINK_RANGE_MULTIPLIER is 2000 for rare, and gives 2x boost to the range
    // and very-rare is 7000 and gives 7x the range
    var baseMultiplier = mod.stats.LINK_RANGE_MULTIPLIER/1000;
    boost += baseMultiplier*scale[i];
  });

  return (linkAmps.length > 0) ? boost : 1.0;
}


window.getAttackApGain = function(d,fieldCount,linkCount) {
  if (!fieldCount) fieldCount = 0;

  var resoCount = 0;
  var maxResonators = MAX_RESO_PER_PLAYER.slice(0);
  var curResonators = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for(var n = PLAYER.level + 1; n < 9; n++) {
    maxResonators[n] = 0;
  }
  $.each(d.resonators, function(ind, reso) {
    if(!reso)
      return true;
    resoCount += 1;
    var reslevel=parseInt(reso.level);
    if(reso.owner === PLAYER.nickname) {
      if(maxResonators[reslevel] > 0) {
        maxResonators[reslevel] -= 1;
      }
    } else {
      curResonators[reslevel] += 1;
    }
  });


  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var destroyAp = resoAp + linkAp + fieldAp;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var enemyAp = destroyAp + captureAp;
  var deployCount = 8 - resoCount;
  var completionAp = (deployCount > 0) ? COMPLETION_BONUS : 0;
  var upgradeCount = 0;
  var upgradeAvailable = maxResonators[8];
  for(var n = 7; n >= 0; n--) {
    upgradeCount += curResonators[n];
    if(upgradeAvailable < upgradeCount) {
        upgradeCount -= (upgradeCount - upgradeAvailable);
    }
    upgradeAvailable += maxResonators[n];
  }
  var friendlyAp = deployCount * DEPLOY_RESONATOR + upgradeCount * UPGRADE_ANOTHERS_RESONATOR + completionAp;
  return {
    friendlyAp: friendlyAp,
    deployCount: deployCount,
    upgradeCount: upgradeCount,
    enemyAp: enemyAp,
    destroyAp: destroyAp,
    resoAp: resoAp,
    captureAp: captureAp
  };
}

//This function will return the potential level a player can upgrade it to
window.potentialPortalLevel = function(d) {
  var current_level = getPortalLevel(d);
  var potential_level = current_level;
  
  if(PLAYER.team === d.team) {
    var resonators_on_portal = d.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function(ind, reso) {
      if(reso !== null && reso.owner === window.PLAYER.nickname) {
        player_resontators[reso.level]--;
      }
      resonator_levels.push(reso === null ? 0 : reso.level);  
    });
    
    resonator_levels.sort(function(a, b) {
      return(a - b);
    });
    
    // Max out portal
    var install_index = 0;
    for(var i=MAX_PORTAL_LEVEL;i>=1; i--) {
      for(var install = player_resontators[i]; install>0; install--) {
        if(resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    //console.log(resonator_levels);
    potential_level = resonator_levels.reduce(function(a, b) {return a + b;}) / 8;
  }
  return(potential_level);
}


window.fixPortalImageUrl = function(url) {
  if (url) {
    if (window.location.protocol === 'https:') {
      url = url.indexOf('www.panoramio.com') !== -1
            ? url.replace(/^http:\/\/www/, 'https://ssl').replace('small', 'medium')
            : url.replace(/^http:\/\//, '//');
    }
    return url;
  } else {
    return DEFAULT_PORTAL_IMG;
  }

}


window.getPortalModsByType = function(d, type) {
  var mods = [];

  var typeToStat = {
    RES_SHIELD: 'MITIGATION',
    FORCE_AMP: 'FORCE_AMPLIFIER',
    TURRET: 'HIT_BONUS',  // and/or ATTACK_FREQUENCY??
    HEATSINK: 'HACK_SPEED',
    MULTIHACK: 'BURNOUT_INSULATION',
    LINK_AMPLIFIER: 'LINK_RANGE_MULTIPLIER',
    ULTRA_LINK_AMP: 'OUTGOING_LINKS_BONUS', // and/or LINK_DEFENSE_BOOST??
  };

  var stat = typeToStat[type];

  $.each(d.mods || [], function(i,mod) {
    if (mod && mod.stats.hasOwnProperty(stat)) mods.push(mod);
  });


  // sorting mods by the stat keeps code simpler, when calculating combined mod effects
  mods.sort (function(a,b) {
    return b.stats[stat] - a.stats[stat];
  });

  return mods;
}



window.getPortalShieldMitigation = function(d) {
  var shields = getPortalModsByType(d, 'RES_SHIELD');

  var mitigation = 0;
  $.each(shields, function(i,s) {
    mitigation += parseInt(s.stats.MITIGATION);
  });

  return mitigation;
}

window.getPortalLinksMitigation = function(linkCount) {
  var mitigation = Math.round(400/9*Math.atan(linkCount/Math.E));
  return mitigation;
}

window.getPortalMitigationDetails = function(d,linkCount) {
  var mitigation = {
    shields: getPortalShieldMitigation(d),
    links: getPortalLinksMitigation(linkCount)
  };

  // mitigation is limited to 95% (as confirmed by Brandon Badger on G+)
  mitigation.total = Math.min(95, mitigation.shields+mitigation.links);

  mitigation.excess = (mitigation.shields+mitigation.links) - mitigation.total;

  return mitigation;
}

window.getMaxOutgoingLinks = function(d) {
  var linkAmps = getPortalModsByType(d, 'ULTRA_LINK_AMP');

  var links = 8;

  linkAmps.forEach(function(mod, i) {
    links += parseInt(mod.stats.OUTGOING_LINKS_BONUS);
  });

  return links;
};

window.getPortalHackDetails = function(d) {

  var heatsinks = getPortalModsByType(d, 'HEATSINK');
  var multihacks = getPortalModsByType(d, 'MULTIHACK');

  // first mod of type is fully effective, the others are only 50% effective
  var effectivenessReduction = [ 1, 0.5, 0.5, 0.5 ];

  var cooldownTime = 300; // 5 mins - 300 seconds 

  $.each(heatsinks, function(index,mod) {
    var hackSpeed = parseInt(mod.stats.HACK_SPEED)/1000000;
    cooldownTime = Math.round(cooldownTime * (1 - hackSpeed * effectivenessReduction[index]));
  });

  var numHacks = 4; // default hacks

  $.each(multihacks, function(index,mod) {
    var extraHacks = parseInt(mod.stats.BURNOUT_INSULATION);
    numHacks = numHacks + (extraHacks * effectivenessReduction[index]);
  });

  return {cooldown: cooldownTime, hacks: numHacks, burnout: cooldownTime*(numHacks-1)};
}

// given a detailed portal structure, return summary portal data, as seen in the map tile data
window.getPortalSummaryData = function(d) {

  // NOTE: the summary data reports unclaimed portals as level 1 - not zero as elsewhere in IITC
  var level = parseInt(getPortalLevel(d));
  if (level == 0) level = 1; //niantic returns neutral portals as level 1, not 0 as used throughout IITC elsewhere

  var resCount = 0;
  if (d.resonators) {
    for (var x in d.resonators) {
      if (d.resonators[x]) resCount++;
    }
  }
  var maxEnergy = getTotalPortalEnergy(d);
  var curEnergy = getCurrentPortalEnergy(d);
  var health = maxEnergy>0 ? parseInt(curEnergy/maxEnergy*100) : 0;

  return {
    level: level,
    title: d.title,
    image: d.image,
    resCount: resCount,
    latE6: d.latE6,
    health: health,
    team: d.team,
    lngE6: d.lngE6,
    type: 'portal'
  };
}

window.getPortalAttackValues = function(d) {
  var forceamps = getPortalModsByType(d, 'FORCE_AMP');
  var turrets = getPortalModsByType(d, 'TURRET');

  // at the time of writing, only rare force amps and turrets have been seen in the wild, so there's a little guesswork
  // at how the stats work and combine
  // algorithm has been compied from getLinkAmpRangeBoost
  // FIXME: only extract stats and put the calculation in a method to be used for link range, force amplifier and attack
  // frequency
  // note: scanner shows rounded values (adding a second FA shows: 2.5x+0.2x=2.8x, which should be 2.5x+0.25x=2.75x)

  // amplifier scale: first is full, second a quarter, the last two an eighth
  var scale = [1.0, 0.25, 0.125, 0.125];

  var attackValues = {
    hit_bonus: 0,
    force_amplifier: 0,
    attack_frequency: 0,
  };

  forceamps.forEach(function(mod, i) {
    // force amp stat FORCE_AMPLIFIER is 2000 for rare, and gives 2x boost to the range
    var baseMultiplier = mod.stats.FORCE_AMPLIFIER / 1000;
    attackValues.force_amplifier += baseMultiplier * scale[i];
  });

  turrets.forEach(function(mod, i) {
    // turret stat ATTACK_FREQUENCY is 2000 for rare, and gives 2x boost to the range
    var baseMultiplier = mod.stats.ATTACK_FREQUENCY / 1000;
    attackValues.attack_frequency += baseMultiplier * scale[i];

    attackValues.hit_bonus += mod.stats.HIT_BONUS / 10000;
  });

  return attackValues;
}




;

// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker


window.portalMarkerScale = function() {
  var zoom = map.getZoom();
  if (L.Browser.mobile)
    return zoom >= 16 ? 1.5 : zoom >= 14 ? 1.2 : zoom >= 11 ? 1.0 : zoom >= 8 ? 0.65 : 0.5;
  else
    return zoom >= 14 ? 1 : zoom >= 11 ? 0.8 : zoom >= 8 ? 0.65 : 0.5;
}

// create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
window.createMarker = function(latlng, data) {
  var styleOptions = window.getMarkerStyleOptions(data);

  var options = L.extend({}, data, styleOptions, { clickable: true });

  var marker = L.circleMarker(latlng, options);

  highlightPortal(marker);

  return marker;
}


window.setMarkerStyle = function(marker, selected) {

  var styleOptions = window.getMarkerStyleOptions(marker.options);

  marker.setStyle(styleOptions);

  // FIXME? it's inefficient to set the marker style (above), then do it again inside the highlighter
  // the highlighter API would need to be changed for this to be improved though. will it be too slow?
  highlightPortal(marker);

  if (selected) {
    marker.setStyle ({color: COLOR_SELECTED_PORTAL});
  }
}


window.getMarkerStyleOptions = function(details) {
  var scale = window.portalMarkerScale();

  //   portal level      0  1  2  3  4  5  6  7  8
  var LEVEL_TO_WEIGHT = [2, 2, 2, 2, 2, 3, 3, 4, 4];
  var LEVEL_TO_RADIUS = [7, 7, 7, 7, 8, 8, 9,10,11];

  var level = Math.floor(details.level||0);

  var lvlWeight = LEVEL_TO_WEIGHT[level] * Math.sqrt(scale);
  var lvlRadius = LEVEL_TO_RADIUS[level] * scale;

  var dashArray = null;
  // thinner and dashed outline for placeholder portals
  if (details.team != TEAM_NONE && level==0) {
    lvlWeight = 1;
    dashArray = [1,2];
  }

  var options = {
    radius: lvlRadius,
    stroke: true,
    color: COLORS[details.team],
    weight: lvlWeight,
    opacity: 1,
    fill: true,
    fillColor: COLORS[details.team],
    fillOpacity: 0.5,
    dashArray: dashArray
  };

  return options;
}



;

// REDEEMING ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

window.REDEEM_SHORT_NAMES = {
  'portal shield':'S',
  'force amp':'FA',
  'link amp':'LA',
  'heatsink':'H',
  'multihack':'M',
  'turret':'T',
  'unusual object':'U',
  'resonator':'R',
  'xmp burster':'X',
  'power cube':'C',
  'media':'M',
  'ultra strike':'US',
}

/* These are HTTP status codes returned by the redemption API.
 * TODO: Move to another file? Use more generally across IITC?
 */
window.REDEEM_STATUSES = {
  429: 'You have been rate-limited by the server. Wait a bit and try again.',
  500: 'Internal server error'
};

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = jqXHR.passcode;

  if(data.error) {
    console.error('Error redeeming passcode "'+passcode+'": ' + data.error)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>' + data.error + '</strong>'
    });
    return;
  }
  if(!data.rewards) {
    console.error('Error redeeming passcode "'+passcode+'": ', data)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>An unexpected error occured</strong>'
    });
    return;
  }

  if(data.playerData) {
    window.PLAYER = data.playerData;
    window.setupPlayerStat();
  }

  var format = "long";
  try {
    format = localStorage["iitc-passcode-format"];
  } catch(e) {}

  var formatHandlers = {
    "short": formatPasscodeShort,
    "long": formatPasscodeLong
  }
  if(!formatHandlers[format])
    format = "long";

  var html = formatHandlers[format](data.rewards);

  var buttons = {};
  Object.keys(formatHandlers).forEach(function(label) {
    if(label == format) return;

    buttons[label.toUpperCase()] = function() {
      $(this).dialog("close");
      localStorage["iitc-passcode-format"] = label;
      handleRedeemResponse(data, textStatus, jqXHR);
    }
  });

  // Display it
  dialog({
    title: 'Passcode: ' + passcode,
    html: html,
    buttons: buttons
  });
};

window.formatPasscodeLong = function(data) {
  var html = '<p><strong>Passcode confirmed. Acquired items:</strong></p><ul class="redeemReward">';

  if(data.other) {
    data.other.forEach(function(item) {
      html += '<li>' + window.escapeHtmlSpecialChars(item) + '</li>';
    });
  }

  if(0 < data.xm)
    html += '<li>' + window.escapeHtmlSpecialChars(data.xm) + ' XM</li>';
  if(0 < data.ap)
    html += '<li>' + window.escapeHtmlSpecialChars(data.ap) + ' AP</li>';

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        html += '<li>' + item.count + 'x ';

        var l = item.level;
        if(0 < l) {
          l = parseInt(l);
          html += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
        }

        html += window.escapeHtmlSpecialChars(type.name) + '</li>';
      });
    });
  }

  html += '</ul>'
  return html;
}

window.formatPasscodeShort = function(data) {

  if(data.other) {
    var awards = data.other.map(window.escapeHtmlSpecialChars);
  } else {
    var awards = [];
  }

  if(0 < data.xm)
    awards.push(window.escapeHtmlSpecialChars(data.xm) + ' XM');
  if(0 < data.ap)
    awards.push(window.escapeHtmlSpecialChars(data.ap) + ' AP');

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        var str = "";
        if(item.count > 1)
          str += item.count + "&nbsp;";

        if(window.REDEEM_SHORT_NAMES[type.name.toLowerCase()]) {
          var shortName = window.REDEEM_SHORT_NAMES[type.name.toLowerCase()];

          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">' + shortName + l + '</span>';
          } else {
            str += shortName;
          }
        } else { // no short name known
          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
          }
          str += type.name;
        }

        awards.push(str);
      });
    });
  }

  return '<p class="redeemReward">' + awards.join(', ') + '</p>'
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;

    var passcode = $(this).val();
    passcode = passcode.replace(/[^\x20-\x7E]+/g, ''); //removes non-printable characters
    if(!passcode) return;

    var jqXHR = window.postAjax('redeemReward', {passcode:passcode}, window.handleRedeemResponse, function(response) {
      var extra = '';
      if(response.status) {
        extra = (window.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
      } else {
        extra = 'No status code was returned.';
      }
      dialog({
        title: 'Request failed: ' + data.passcode,
        html: '<strong>The HTTP request failed.</strong> ' + extra
      });
    });
    jqXHR.passcode = passcode;
  });
};


;



window.regionScoreboard = function() {
  // TODO: rather than just load the region scores for the center of the map, display a list of regions in the current view
  // and let the user select one (with automatic selection when just one region, and limited to close enough zooms so list size is reasonable)
  var latLng = map.getCenter();

  var latE6 = Math.round(latLng.lat*1E6);
  var lngE6 = Math.round(latLng.lng*1E6);

  var dlg = dialog({title:'Region scores',html:'Loading regional scores...',width:450,minHeight:320});

  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, function(res){regionScoreboardSuccess(res,dlg);}, function(){regionScoreboardFailure(dlg);});
}

function regionScoreboardFailure(dlg) {
  dlg.html('Failed to load region scores - try again');
}


function regionScoreboardScoreHistoryChart(result, logscale) {
  // svg area 400x130. graph area 350x100, offset to 40,10

  if(!Math.log10)
    Math.log10 = function(x) { return Math.log(x) / Math.LN10; };

  var max = Math.max(result.gameScore[0],result.gameScore[1],10); //NOTE: ensure a min of 10 for the graph
  var items = []; //we'll copy the items to an array indexed by checkpoint number - easier to access!
  for (var i=0; i<result.scoreHistory.length; i++) {
    max = Math.max(max, result.scoreHistory[i][1], result.scoreHistory[i][2]); //note: index 0 is the checkpoint number here
    items[result.scoreHistory[i][0]] = [result.scoreHistory[i][1], result.scoreHistory[i][2]];
  }

  // scale up maximum a little, so graph isn't squashed right against upper edge
  max *= 1.09;

  // 0 cannot be displayed on a log scale, so we set the minimum to 0.001 and divide by lg(0.001)=-3
  var scale = logscale
    ? function(y) { return  10 - Math.log10(Math.max(0.001,y/max)) / 3 * 100; }
    : function(y) { return 110-y/max*100; };

  var teamPaths = [[],[]];
  var otherSvg = [];

  for (var i=0; i<items.length; i++) {
    var x=i*10+40;
    if (items[i] !== undefined) {
      // paths
      if (i>0 && items[i-1] !== undefined) {
        for (var t=0; t<2; t++) {
          teamPaths[t].push('M'+(x-10)+','+scale(items[i-1][t])+' L'+x+','+scale(items[i][t]));
        }
      }
      // markers
      otherSvg.push('<g title="test" class="checkpoint" data-cp="'+i+'" data-enl="'+items[i][0]+'" data-res="'+items[i][1]+'">');
      otherSvg.push('<rect x="'+(i*10+35)+'" y="10" width="10" height="100" fill="black" fill-opacity="0" />');
      for (var t=0; t<2; t++) {
        var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
        otherSvg.push('<circle cx="'+x+'" cy="'+scale(items[i][t])+'" r="3" stroke-width="1" stroke="'+col+'" fill="'+col+'" fill-opacity="0.5" />');
      }
      otherSvg.push('</g>');
    }
  }


  var paths = '<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />';

  // graph tickmarks - horizontal
  var ticks = [];
  for (var i=5; i<=35; i+=5) {
    var x=i*10+40;
    ticks.push('M'+x+',10 L'+x+',110');
    otherSvg.push('<text x="'+x+'" y="125" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="middle" fill="#fff">'+i+'</text>');
  }

  // vertical
  // first we calculate the power of 10 that is smaller than the max limit
  var vtickStep = Math.pow(10,Math.floor(Math.log10(max)));
  var vticks = [];
  if(logscale) {
    for(var i=0;i<4;i++) {
      vticks.push(vtickStep);
      vtickStep /= 10;
    }
  } else {
    // this could be between 1 and 10 grid lines - so we adjust to give nicer spacings
    if (vtickStep < (max/5)) {
      vtickStep *= 2;
    } else if (vtickStep > (max/2)) {
      vtickStep /= 2;
    }
    for (var i=vtickStep; i<=max; i+=vtickStep) {
      vticks.push(i);
    }
  }
  vticks.forEach(function(i) {
    var y = scale(i);

    ticks.push('M40,'+y+' L390,'+y);

    var istr = i>=1000000000 ? i/1000000000+'B' : i>=1000000 ? i/1000000+'M' : i>=1000 ? i/1000+'k' : i;
    otherSvg.push('<text x="35" y="'+y+'" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="end" fill="#fff">'+istr+'</text>');
  });

  paths += '<path d="'+ticks.join(' ')+'" stroke="#fff" opacity="0.3" />;'

  for (var t=0; t<2; t++) {
    var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    if (teamPaths[t].length > 0) {
      paths += '<path d="'+teamPaths[t].join(' ')+'" stroke="'+col+'" />';
    }

    var y = scale(result.gameScore[t]);
    paths += '<path d="M40,'+y+' L390,'+y+'" stroke="'+col+'" stroke-dasharray="3,2" opacity="0.8" />';
  }

  var svg = '<div><svg width="400" height="130">'
           +'<rect x="0" y="0" width="400" height="130" stroke="#FFCE00" fill="#08304E" />'
           +paths
           +otherSvg.join('')
           +'<foreignObject height="18" width="45" y="111" x="0" class="node"><label title="Logarithmic scale">'
           +'<input type="checkbox" class="logscale" style="height:auto;padding:0;vertical-align:middle"'+(logscale?' checked':'')+'/>'
           +'log</label></foreignObject>'
           +'</svg></div>';

  return svg;
}

function regionScoreboardScoreHistoryTable(result) {
  var history = result.scoreHistory;
  var table = '<table class="checkpoint_table"><thead><tr><th>Checkpoint</th><th>Enlightened</th><th>Resistance</th></tr></thead>';

  for(var i=0; i<history.length; i++) {
    table += '<tr><td>' + history[i][0] + '</td><td>' + digits(history[i][1]) + '</td><td>' + digits(history[i][2]) + '</td></tr>';
  }

  table += '</table>';
  return table;
}

function regionScoreboardSuccess(data,dlg,logscale) {
  if (data.result === undefined) {
    return regionScoreboardFailure(dlg);
  }

  var agentTable = '<table><tr><th>#</th><th>Agent</th></tr>';
  for (var i=0; i<data.result.topAgents.length; i++) {
    var agent = data.result.topAgents[i];
    agentTable += '<tr><td>'+(i+1)+'</td><td class="nickname '+(agent.team=='RESISTANCE'?'res':'enl')+'">'+agent.nick+'</td></tr>';
  }
  if (data.result.topAgents.length==0) {
    agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
  }
  agentTable += '</table>';


  var maxAverage = Math.max(data.result.gameScore[0], data.result.gameScore[1], 1);
  var teamRow = [];
  for (var t=0; t<2; t++) {
    var team = t==0 ? 'Enlightened' : 'Resistance';
    var teamClass = t==0 ? 'enl' : 'res';
    var teamCol = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    var barSize = Math.round(data.result.gameScore[t]/maxAverage*200);
    teamRow[t] = '<tr><th class="'+teamClass+'">'+team+'</th><td class="'+teamClass+'">'+digits(data.result.gameScore[t])+'</td><td><div style="background:'+teamCol+'; width: '+barSize+'px; height: 1.3ex; border: 2px outset '+teamCol+'"> </td></tr>';

  }

  var first = PLAYER.team == 'RESISTANCE' ? 1 : 0;

  // we need some divs to make the accordion work properly
  dlg.html('<div class="cellscore">'
         +'<b>Region scores for '+data.result.regionName+'</b>'
         +'<div><table>'+teamRow[first]+teamRow[1-first]+'</table>'
         +regionScoreboardScoreHistoryChart(data.result, logscale)+'</div>'
         +'<b>Checkpoint overview</b>'
         +'<div>'+regionScoreboardScoreHistoryTable(data.result)+'</div>'
         +'<b>Top agents</b>'
         +'<div>'+agentTable+'</div>'
         +'</div>');

  $('g.checkpoint', dlg).each(function(i, elem) {
    elem = $(elem);

    var tooltip = 'CP:\t'+elem.attr('data-cp')
      + '\nEnl:\t' + digits(elem.attr('data-enl'))
      + '\nRes:\t' + digits(elem.attr('data-res'));
    elem.tooltip({
      content: convertTextToTableMagic(tooltip),
      position: {my: "center bottom", at: "center top-10"}
    });
  });

  $('.cellscore', dlg).accordion({
    header: 'b',
    heightStyle: "fill",
  });

  $('input.logscale', dlg).change(function(){
    var input = $(this);
    regionScoreboardSuccess(data, dlg, input.prop('checked'));
  });
}


;


// REQUEST HANDLING //////////////////////////////////////////////////
// note: only meant for portal/links/fields request, everything else
// does not count towards “loading”

window.activeRequests = [];
window.failedRequestCount = 0;
window.statusTotalMapTiles = 0;
window.statusCachedMapTiles = 0;
window.statusSuccessMapTiles = 0;
window.statusStaleMapTiles = 0;
window.statusErrorMapTiles = 0;


window.requests = function() {}

//time of last refresh
window.requests._lastRefreshTime = 0;
window.requests._quickRefreshPending = false;

window.requests.add = function(ajax) {
  window.activeRequests.push(ajax);
  renderUpdateStatus();
}

window.requests.remove = function(ajax) {
  window.activeRequests.splice(window.activeRequests.indexOf(ajax), 1);
  renderUpdateStatus();
}

window.requests.abort = function() {
  $.each(window.activeRequests, function(ind, actReq) {
    if(actReq) actReq.abort();
  });

  window.activeRequests = [];
  window.failedRequestCount = 0;
  window.chat._requestPublicRunning  = false;
  window.chat._requestFactionRunning  = false;

  renderUpdateStatus();
}



// sets the timer for the next auto refresh. Ensures only one timeout
// is queued. May be given 'override' in milliseconds if time should
// not be guessed automatically. Especially useful if a little delay
// is required, for example when zooming.
window.startRefreshTimeout = function(override) {
  // may be required to remove 'paused during interaction' message in
  // status bar
  window.renderUpdateStatus();
  if(refreshTimeout) clearTimeout(refreshTimeout);
  if(override == -1) return;  //don't set a new timeout

  var t = 0;
  if(override) {
    window.requests._quickRefreshPending = true;
    t = override;
    //ensure override can't cause too fast a refresh if repeatedly used (e.g. lots of scrolling/zooming)
    timeSinceLastRefresh = new Date().getTime()-window.requests._lastRefreshTime;
    if(timeSinceLastRefresh < 0) timeSinceLastRefresh = 0;  //in case of clock adjustments
    if(timeSinceLastRefresh < MINIMUM_OVERRIDE_REFRESH*1000)
      t = (MINIMUM_OVERRIDE_REFRESH*1000-timeSinceLastRefresh);
  } else {
    window.requests._quickRefreshPending = false;
    t = REFRESH*1000;

    var adj = ZOOM_LEVEL_ADJ * (18 - map.getZoom());
    if(adj > 0) t += adj*1000;
  }
  var next = new Date(new Date().getTime() + t).toLocaleTimeString();
//  console.log('planned refresh in ' + (t/1000) + ' seconds, at ' + next);
  refreshTimeout = setTimeout(window.requests._callOnRefreshFunctions, t);
  renderUpdateStatus();
}

window.requests._onRefreshFunctions = [];
window.requests._callOnRefreshFunctions = function() {
//  console.log('running refresh at ' + new Date().toLocaleTimeString());
  startRefreshTimeout();

  if(isIdle()) {
//    console.log('user has been idle for ' + idleTime + ' seconds, or window hidden. Skipping refresh.');
    renderUpdateStatus();
    return;
  }

//  console.log('refreshing');

  //store the timestamp of this refresh
  window.requests._lastRefreshTime = new Date().getTime();

  $.each(window.requests._onRefreshFunctions, function(ind, f) {
    f();
  });
}


// add method here to be notified of auto-refreshes
window.requests.addRefreshFunction = function(f) {
  window.requests._onRefreshFunctions.push(f);
}

window.requests.isLastRequest = function(action) {
  var result = true;
  $.each(window.activeRequests, function(ind, req) {
    if(req.action === action) {
      result = false;
      return false;
    }
  });
  return result;
}


;


// SEARCH /////////////////////////////////////////////////////////

/*
you can implement your own result provider by listing to the search hook:
addHook('search', function(query) {});

`query` is an object with the following members:
- `term` is the term for which the user has searched
- `confirmed` is a boolean indicating if the user has pressed enter after searching. You should not search online or 
  heavy processing unless the user has confirmed the search term
- `addResult(result)` can be called to add a result to the query.

`result` may have the following members (`title` is required, as well as one of `position` and `bounds`):
- `title`: the label for this result. Will be interpreted as HTML, so make sure to escape properly.
- `description`: secondary information for this result. Will be interpreted as HTML, so make sure to escape properly.
- `position`: a L.LatLng object describing the position of this result
- `bounds`: a L.LatLngBounds object describing the bounds of this result
- `layer`: a ILayer to be added to the map when the user selects this search result. Will be generated if not set.
  Set to `null` to prevent the result from being added to the map.
- `icon`: a URL to a icon to display in the result list. Should be 12x12.
- `onSelected(result, event)`: a handler to be called when the result is selected. May return `true` to prevent the map
  from being repositioned. You may reposition the map yourself or do other work.
- `onRemove(result)`: a handler to be called when the result is removed from the map (because another result has been
  selected or the search was cancelled by the user).
*/

window.search = {
  lastSearch: null,
};

window.search.Query = function(term, confirmed) {
  this.term = term;
  this.confirmed = confirmed;
  this.init();
};
window.search.Query.prototype.init = function() {
  this.results = [];

  this.container = $('<div>').addClass('searchquery');

  this.header = $('<h3>')
    .text(this.confirmed
      ? this.term
      : ((this.term.length > 16
        ? this.term.substr(0,8) + '…' + this.term.substr(this.term.length-8,8)
        : this.term)
        + ' (Return to load more)'))
    .appendTo(this.container);

  this.list = $('<ul>')
    .appendTo(this.container)
    .append($('<li>').text(this.confirmed ? 'No local results, searching online...' : 'No local results.'));

  this.container.accordion({
    collapsible: true,
    heightStyle: 'content',
  });

  runHooks('search', this);
};
window.search.Query.prototype.show = function() {
  this.container.appendTo('#searchwrapper');
};
window.search.Query.prototype.hide = function() {
  this.container.remove();
  this.removeSelectedResult();
};
window.search.Query.prototype.addResult = function(result) {
  if(this.results.length == 0) {
    // remove 'No results'
    this.list.empty();
  }

  this.results.push(result);
  var item = $('<li>')
    .appendTo(this.list)
    .attr('tabindex', '0')
    .on('click dblclick', function(ev) {
      this.onResultSelected(result, ev);
    }.bind(this))
    .keypress(function(ev) {
      if((ev.keyCode || ev.charCode || ev.which) == 32) {
        ev.preventDefault();
        ev.type = 'click';
        $(this).trigger(ev);
        return;
      }
      if((ev.keyCode || ev.charCode || ev.which) == 13) {
        ev.preventDefault();
        ev.type = 'dblclick';
        $(this).trigger(ev);
        return;
      }
    });

  var link = $('<a>')
    .append(result.title)
    .appendTo(item);

  if(result.icon) {
    link.css('background-image', 'url("'+result.icon+'")');
    item.css('list-style', 'none');
  }

  if(result.description) {
    item
      .append($('<br>'))
      .append($('<em>')
        .append(result.description));
  }

};
window.search.Query.prototype.onResultSelected = function(result, ev) {
  this.removeSelectedResult();
  this.selectedResult = result;

  if(result.onSelected) {
    if(result.onSelected(result, ev)) return;
  }

  if(ev.type == 'dblclick') {
    if(result.position) {
      map.setView(result.position, 17);
    } else if(result.bounds) {
      map.fitBounds(result.bounds, {maxZoom: 17});
    }
  } else { // ev.type != 'dblclick'
    if(result.bounds) {
      map.fitBounds(result.bounds, {maxZoom: 17});
    } else if(result.position) {
      map.setView(result.position);
    }
  }

  if(result.layer !== null && !result.layer) {
    result.layer = L.layerGroup();

    if(result.position) {
      createGenericMarker(result.position, 'red', {
        title: result.title
      }).addTo(result.layer);
    }

    if(result.bounds) {
      L.rectangle(result.bounds, {
        title: result.title,
        clickable: false,
        color: 'red',
        fill: false,
      }).addTo(result.layer);
    }
  }

  if(result.layer)
    map.addLayer(result.layer);

  if(window.isSmartphone()) window.show('map');
}
window.search.Query.prototype.removeSelectedResult = function() {
  if(this.selectedResult) {
    if(this.selectedResult.layer) map.removeLayer(this.selectedResult.layer);
    if(this.selectedResult.onRemove) this.selectedResult.onRemove(this.selectedResult);
  }
}

window.search.doSearch = function(term, confirmed) {
  term = term.trim();

  // minimum 3 characters for automatic search
  if(term.length < 3 && !confirmed) return;

  // don't clear last confirmed search
  if(window.search.lastSearch
  && window.search.lastSearch.confirmed
  && !confirmed)
    return;

  // don't make the same query again
  if(window.search.lastSearch
  && window.search.lastSearch.confirmed == confirmed
  && window.search.lastSearch.term == term)
    return;

  if(window.search.lastSearch) window.search.lastSearch.hide();
  window.search.lastSearch = null;

  // clear results
  if(term == '') return;

  if(useAndroidPanes()) show('info');

  $('.ui-tooltip').remove();

  window.search.lastSearch = new window.search.Query(term, confirmed);
  window.search.lastSearch.show();
};

window.search.setup = function() {
  $('#search')
    .keypress(function(e) {
      if((e.keyCode ? e.keyCode : e.which) != 13) return;
      e.preventDefault();

      var term = $(this).val();

      clearTimeout(window.search.timer);
      window.search.doSearch(term, true);
    })
    .on('keyup keypress change paste', function(e) {
      clearTimeout(window.search.timer);
      window.search.timer = setTimeout(function() {
        var term = $(this).val();
        window.search.doSearch(term, false);
      }.bind(this), 500);
    });
  $('#buttongeolocation').click(function(){
    map.locate({setView : true, maxZoom: 13});
  });
};

addHook('search', function(query) {
  var term = query.term.toLowerCase();
  var teams = ['NEU','RES','ENL'];

  $.each(portals, function(guid, portal) {
    var data = portal.options.data;
    if(!data.title) return;

    if(data.title.toLowerCase().indexOf(term) !== -1) {
      var team = portal.options.team;
      var color = team==TEAM_NONE ? '#CCC' : COLORS[team];
      query.addResult({
        title: data.title,
        description: teams[team] + ', L' + data.level + ', ' + data.health + '%, ' + data.resCount + ' Resonators',
        position: portal.getLatLng(),
        icon: 'data:image/svg+xml;base64,'+btoa('<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.1">\n	<g style="fill:%COLOR%;stroke:none">\n		<path d="m 6,12 -2,-12  4,0 z" />\n		<path d="m 6,12 -4, -8  8,0 z" />\n		<path d="m 6,12 -6, -4 12,0 z" />\n	</g>\n</svg>\n'.replace(/%COLOR%/g, color)),
        onSelected: function(result, event) {
          if(event.type == 'dblclick') {
            zoomToAndShowPortal(guid, portal.getLatLng());
          } else if(window.portals[guid]) {
            if(!map.getBounds().contains(result.position)) map.setView(result.position);
            renderPortalDetails(guid);
          } else {
            window.selectPortalByLatLng(portal.getLatLng());
          }
          return true; // prevent default behavior
        },
      });
    }
  });
});

// TODO: recognize 50°31'03.8"N 7°59'05.3"E and similar formats
// TODO: if a portal with these exact coordinates is found, select it
addHook('search', function(query) {
  if(query.term.split(',').length == 2) {
    var ll = query.term.split(',');
    if(!isNaN(ll[0]) && !isNaN(ll[1])) {
      query.addResult({
        title: query.term,
        description: 'geo coordinates',
        position: L.latLng(parseFloat(ll[0]), parseFloat(ll[1])),
      });
    }
  }
});

addHook('search', function(query) {
  if(!query.confirmed) return;

  $.getJSON(NOMINATIM + encodeURIComponent(query.term), function(data) {
    if(data.length == 0) {
      query.addResult({
        title: 'No results on OpenStreetMap',
        icon: '//www.openstreetmap.org/favicon.ico',
        onSelected: function() {return true;},
      });
      return;
    }

    data.forEach(function(item) {
      var result = {
        title: item.display_name,
        description: 'Type: ' + item.type,
        position: L.latLng(parseFloat(item.lat), parseFloat(item.lon)),
        icon: item.icon,
      };

      if(item.geojson) {
        result.layer = L.geoJson(item.geojson, {
          clickable: false,
          color: 'red',
          opacity: 0.7,
          weight: 2,
          fill: false,
          pointToLayer: function(featureData,latLng) {
            return createGenericMarker(latLng,'red');
          }
        });
      }

      var b = item.boundingbox;
      if(b) {
        var southWest = new L.LatLng(b[0], b[2]),
            northEast = new L.LatLng(b[1], b[3]);
        result.bounds = new L.LatLngBounds(southWest, northEast);
      }

      query.addResult(result);
    });
  });
});



;


// posts AJAX request to Ingress API.
// action: last part of the actual URL, the rpc/dashboard. is
//         added automatically
// data: JSON data to post. method will be derived automatically from
//       action, but may be overridden. Expects to be given Hash.
//       Strings are not supported.
// success: method to call on success. See jQuery API docs for avail-
//          able arguments: http://api.jquery.com/jQuery.ajax/
// error: see above. Additionally it is logged if the request failed.
window.postAjax = function(action, data, successCallback, errorCallback) {
  // state management functions... perhaps should be outside of this func?

//  var remove = function(data, textStatus, jqXHR) { window.requests.remove(jqXHR); };
//  var errCnt = function(jqXHR) { window.failedRequestCount++; window.requests.remove(jqXHR); };

  if (window.latestFailedRequestTime && window.latestFailedRequestTime < Date.now()-120*1000) {
    // no errors in the last two minutes - clear the error count
    window.failedRequestCount = 0;
    window.latestFailedRequestTime = undefined;
  }

  var onError = function(jqXHR, textStatus, errorThrown) {
    window.requests.remove(jqXHR);
    window.failedRequestCount++;

    window.latestFailedRequestTime = Date.now();

    // pass through to the user error func, if one exists
    if (errorCallback) {
      errorCallback(jqXHR, textStatus, errorThrown);
    }
  };

  var onSuccess = function(data, textStatus, jqXHR) {
    window.requests.remove(jqXHR);

    // the Niantic server can return a HTTP success, but the JSON response contains an error. handle that sensibly
    if (data && data.error && data.error == 'out of date') {
      window.failedRequestCount++;
      // let's call the error callback in thos case...
      if (errorCallback) {
        errorCallback(jqXHR, textStatus, "data.error == 'out of date'");
      }

      window.outOfDateUserPrompt();
    } else {
      successCallback(data, textStatus, jqXHR);
    }
  };

  // we set this flag when we want to block all requests due to having an out of date CURRENT_VERSION
  if (window.blockOutOfDateRequests) {
    window.failedRequestCount++;
    window.latestFailedRequestTime = Date.now();

    // call the error callback, if one exists
    if (errorCallback) {
      // NOTE: error called on a setTimeout - as it won't be expected to be synchronous
      // ensures no recursion issues if the error handler immediately resends the request
      setTimeout(function(){errorCallback(null, undefined, "window.blockOutOfDateRequests is set");}, 10);
    }
    return;
  }

  var versionStr = niantic_params.CURRENT_VERSION;
  var post_data = JSON.stringify($.extend({}, data, {v: versionStr}));

  var result = $.ajax({
    url: '/r/'+action,
    type: 'POST',
    data: post_data,
    context: data,
    dataType: 'json',
    success: [onSuccess],
    error: [onError],
    contentType: 'application/json; charset=utf-8',
    beforeSend: function(req) {
      req.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
    }
  });
  result.action = action;

  requests.add(result);

  return result;
}


window.outOfDateUserPrompt = function()
{
  // we block all requests while the dialog is open. 
  if (!window.blockOutOfDateRequests) {
    window.blockOutOfDateRequests = true;

    dialog({
      title: 'Reload IITC',
      html: '<p>IITC is using an outdated version code. This will happen when Niantic updates the standard intel site.</p>'
           +'<p>You need to reload the page to get the updated changes.</p>'
           +'<p>If you have just reloaded the page, then an old version of the standard site script is cached somewhere.'
           +'In this case, try clearing your cache, or waiting 15-30 minutes for the stale data to expire.</p>',
      buttons: {
        'RELOAD': function() {
          if (typeof android !== 'undefined' && android && android.reloadIITC) {
            android.reloadIITC();
          } else {
            window.location.reload();
          }
        }
      },
      close: function(event, ui) {
        delete window.blockOutOfDateRequests;
      }

    });


  }

}


;

window.isSmartphone = function() {
  // this check is also used in main.js. Note it should not detect
  // tablets because their display is large enough to use the desktop
  // version.

  // The stock intel site allows forcing mobile/full sites with a vp=m or vp=f
  // parameter - let's support the same. (stock only allows this for some
  // browsers - e.g. android phone/tablet. let's allow it for all, but
  // no promises it'll work right)
  var viewParam = getURLParam('vp');
  if (viewParam == 'm') return true;
  if (viewParam == 'f') return false;

  return navigator.userAgent.match(/Android.*Mobile/);
}

window.smartphone = function() {};

window.runOnSmartphonesBeforeBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone pre boot stuff');

  // add smartphone stylesheet
  headHTML = document.getElementsByTagName('head')[0].innerHTML;
  headHTML += '<style>body {\n  color: #fff;\n}\n\n#updatestatus {\n  background: #262c32;\n  width: 100%;\n  color: #d4d5d6;\n  border: 0;\n  padding: 0;\n}\n\n#updatestatus .map {\n  margin-left: 4px;\n}\n\n#innerstatus {\n  padding: 4px;\n  float: right;\n  width: 50%;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#loadlevel {\n  border-width: 0;\n  background: transparent;\n  color: #FFF;\n}\n\n#mobileinfo {\n  float: left;\n  width: 50%;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n  position:relative;\n  padding: 4px 0;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#mobileinfo .portallevel {\n  padding: 0 0.25em;\n  color: #FFF;\n}\n\n#mobileinfo .resonator {\n  position: absolute;\n  width: 12%; /* a little less that 1/8 to have a small distance */\n  height: 100%;\n  top: 0;\n  border-top: 3px solid red;\n  box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n}\n\n#mobileinfo .resonator.north:before {\n  content: "";\n  background-color: red;\n  border-radius: 100%;\n  display: block;\n  height: 6px;\n  width: 6px;\n  left: 50%;\n  top: -3px; \n  margin-left: -3px;\n  position: absolute;\n  z-index: -1;\n}\n\n#mobileinfo .filllevel {\n  position: absolute;\n  bottom: 0;\n  height: 3px;\n}\n\n#mobileinfo .enl .filllevel {\n  background-color: #03fe03 !important;\n}\n\n#mobileinfo .res .filllevel {\n  background-color: #00c5ff !important;\n}\n\n#name #signout { /* no hover, always show signout button */\n  display: block;\n}\n\n#sidebar, #chatcontrols, #chat, #chatinput {\n  background: transparent !important;\n}\n\n.leaflet-top .leaflet-control {\n  margin-top: 5px !important;\n  margin-left: 5px !important;\n}\n\n#searchwrapper {\n  font-size: 1.2em;\n}\n#searchwrapper .ui-accordion-header {\n  padding: 0.3em 0;\n}\n#searchwrapper li {\n  line-height: 1.3em;\n}\n\n#chatcontrols {\n  height: 38px;\n  width: 100%;\n  display: none !important;\n}\n\n/* hide shrink button */\n#chatcontrols a:first-child {\n  display: none;\n}\n\n#chatcontrols a {\n  width: 50px;\n  height:36px;\n  overflow: hidden;\n  vertical-align: middle;\n  line-height: 36px;\n  text-decoration: none;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#chat {\n  left:0;\n  right:0;\n  top: 1px !important;\n  bottom:30px;\n  width: auto;\n}\n\n#chatinput {\n  width: 100%;\n  height: 30px;\n}\n\n#chat td:nth-child(2), #chatinput td:nth-child(2) {\n  width: 77px;\n}\n\n#chatcontrols a.active {\n  border-color: #FFCE00;\n  border-bottom-width:0px;\n  font-weight:bold\n}\n\n#chatcontrols a.active + a {\n  border-left-color: #FFCE00\n}\n\n#sidebartoggle {\n  display: none !important;\n}\n\n#scrollwrapper {\n  bottom: 0;\n  max-height: none !important;\n  width: 100% !important;\n  right: 0;\n  left:0;\n}\n\n#sidebar {\n  width: 100% !important;\n  min-height: 100%;\n  border:0;\n}\n\n#sidebar > * {\n  width: 100%;\n}\n\n#playerstat {\n  margin-top: 5px;\n}\n\n#portaldetails {\n  min-height: 0;\n}\n\n.fullimg {\n  width: 100%;\n}\n\n/*\n * for some reason leaflet popups on mobile are colored white on white\n * so force the popup msg color to black\n */\n.leaflet-popup-content{\n    color:black;\n}\n\n\n/* add extra padding, and a button effect, to sidebar link areas */\n.linkdetails aside  {\n  padding: 5px;\n  margin-top: 3px;\n  margin-bottom: 3px;\n  border: 2px outset #20A8B1;\n}\n\n#toolbox > a {\n  padding: 5px;\n  margin-top: 3px;\n  margin-bottom: 3px;\n  border: 2px outset #20A8B1;\n}\n\n#portaldetails .close {\n  padding: 4px;\n  border: 1px outset #20A8B1;\n  margin-top: 2px;\n}\n</style>';
  document.getElementsByTagName('head')[0].innerHTML = headHTML;

  // don’t need many of those
  window.setupStyles = function() {
    $('head').append('<style>' +
      [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
        '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
        '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } '].join("\n")
      + '</style>');
  }

  window.smartphone.mapButton = $('<a>map</a>').click(function() {
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('#chatcontrols a .active').removeClass('active');
    $("#chatcontrols a:contains('map')").addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
    $('#scrollwrapper').show();
    $('.active').removeClass('active');
    $("#chatcontrols a:contains('info')").addClass('active');
  });

  $('#chatcontrols').append(smartphone.mapButton).append(smartphone.sideButton);

  window.addHook('portalDetailsUpdated', function(data) {
    var x = $('.imgpreview img').removeClass('hide');

    if(!x.length) {
      $('.fullimg').remove();
      return;
    }

    if($('.fullimg').length) {
      $('.fullimg').replaceWith(x.addClass('fullimg'));
    } else {
      x.addClass('fullimg').appendTo('#sidebar');
    }
  });
}

window.smartphoneInfo = function(data) {
  var guid = data.selectedPortalGuid;
  if(!window.portals[guid]) return;

  var data = window.portals[selectedPortal].options.data;
  var details = window.portalDetail.get(guid);

  var lvl = data.level;
  if(data.team === "NEUTRAL")
    var t = '<span class="portallevel">L0</span>';
  else
    var t = '<span class="portallevel" style="background: '+COLORS_LVL[lvl]+';">L' + lvl + '</span>';

  var percentage = data.health;
  if(details) {
    var totalEnergy = getTotalPortalEnergy(details);
    if(getTotalPortalEnergy(details) > 0) {
      percentage = Math.floor(getCurrentPortalEnergy(details) / totalEnergy * 100);
    }
  }
  t += ' ' + percentage + '% ';
  t += data.title;

  if(details) {
    var l,v,max,perc;
    var eastAnticlockwiseToNorthClockwise = [2,1,0,7,6,5,4,3];

    for(var ind=0;ind<8;ind++)
    {
      if (details.resonators.length == 8) {
        var slot = eastAnticlockwiseToNorthClockwise[ind];
        var reso = details.resonators[slot];
      } else {
        var slot = null;
        var reso = ind < details.resonators.length ? details.resonators[ind] : null;
      }

      var className = TEAM_TO_CSS[getTeam(details)];
      if(slot !== null && OCTANTS[slot] === 'N')
        className += ' north'
      if(reso) {
        l = parseInt(reso.level);
        v = parseInt(reso.energy);
        max = RESO_NRG[l];
        perc = v/max*100;
      } else {
        l = 0;
        v = 0;
        max = 0;
        perc = 0;
      }

      t += '<div class="resonator '+className+'" style="border-top-color: '+COLORS_LVL[l]+';left: '+(100*ind/8.0)+'%;">';
      t += '<div class="filllevel" style="width:'+perc+'%;"></div>';
      t += '</div>'
    }
  }

  $('#mobileinfo').html(t);
}

window.runOnSmartphonesAfterBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone post boot stuff');

  window.show('map');

  // add a div/hook for updating mobile info
  $('#updatestatus').prepend('<div id="mobileinfo" onclick="show(\'info\')"></div>');
  window.addHook('portalSelected', window.smartphoneInfo);
  // init msg of status bar. hint for the user that a tap leads to the info screen
  $('#mobileinfo').html('<div style="text-align: center"><b>tap here for info screen</b></div>');

  // disable img full view
  $('#portaldetails').off('click', '**');

  // make buttons in action bar flexible
  var l = $('#chatcontrols a:visible');
  l.css('width', 100/l.length + '%');

  // notify android that a select spinner is enabled.
  // this disables javascript injection on android side.
  // if android is not notified, the spinner closes on the next JS call
  if (typeof android !== 'undefined' && android && android.spinnerEnabled) {
    $("body").on("click", "select", function() {
      android.spinnerEnabled(true);
    });
  }

  // add event to portals that allows long press to switch to sidebar
  window.addHook('portalAdded', function(data) {
    data.portal.on('add', function() {
      if(!this._container || this.options.addedTapHoldHandler) return;
      this.options.addedTapHoldHandler = true;
      var guid = this.options.guid;

      // this is a hack, accessing Leaflet’s private _container is evil
      $(this._container).on('taphold', function() {
        window.renderPortalDetails(guid);
        window.show('info');
      });
    });
  });

  if(typeof android !== 'undefined' && android && android.setPermalink) {
    window.map.on('moveend', window.setAndroidPermalink);
    addHook('portalSelected', window.setAndroidPermalink);
  }


  // for some reason, leaflet misses the WebView size being set at startup on IITC Mobile
  // create a short timer that checks for this issue
  setTimeout (function() { map.invalidateSize(); }, 0.2*1000);

}



window.setAndroidPermalink = function() {
  var c = window.map.getCenter();
  var lat = Math.round(c.lat*1E6)/1E6;
  var lng = Math.round(c.lng*1E6)/1E6;

  var href = '/intel?ll='+lat+','+lng+'&z=' + map.getZoom();

  if(window.selectedPortal && window.portals[window.selectedPortal]) {
    var p = window.portals[window.selectedPortal].getLatLng();
    lat = Math.round(p.lat*1E6)/1E6;
    lng = Math.round(p.lng*1E6)/1E6;
    href += '&pll='+lat+','+lng;
  }

  href = $('<a>').prop('href',  href).prop('href'); // to get absolute URI
  android.setPermalink(href);
}

window.useAndroidPanes = function() {
  // isSmartphone is important to disable panes in desktop mode
  return (typeof android !== 'undefined' && android && android.addPane && window.isSmartphone());
}

if(typeof android !== 'undefined' && android && android.getFileRequestUrlPrefix) {
  window.requestFile = function(callback) {
    do {
      var funcName = "onFileSelected" + parseInt(Math.random()*0xFFFF).toString(16);
    } while(window[funcName] !== undefined)

    window[funcName] = function(filename, content) {
      callback(decodeURIComponent(filename), atob(content));
    };
    var script = document.createElement('script');
    script.src = android.getFileRequestUrlPrefix() + funcName;
    (document.body || document.head || document.documentElement).appendChild(script);
  };
}



;

// STATUS BAR ///////////////////////////////////////

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatusTimer_ = undefined;

window.renderUpdateStatus = function() {
  var progress = 1;

  // portal/limk level display

  var zoom = map.getZoom();
  zoom = getDataZoomForMapZoom(zoom);
  var tileParams = getMapZoomTileParameters(zoom);

  var t = '<span class="help portallevel" title="Indicates portal levels/link lengths displayed.  Zoom in to display more.">';

  if (tileParams.hasPortals) {
    // zoom level includes portals (and also all links/fields)
    if(!window.isSmartphone()) // space is valuable
      t += '<b>portals</b>: ';
    if(tileParams.level === 0)
      t += '<span id="loadlevel">all</span>';
    else
      t += '<span id="loadlevel" style="background:'+COLORS_LVL[tileParams.level]+'">L'+tileParams.level+(tileParams.level<8?'+':'') + '</span>';
  } else {
    if(!window.isSmartphone()) // space is valuable
      t += '<b>links</b>: ';

    if (tileParams.minLinkLength > 0)
      t += '<span id="loadlevel">&gt;'+(tileParams.minLinkLength>1000?tileParams.minLinkLength/1000+'km':tileParams.minLinkLength+'m')+'</span>';
    else
      t += '<span id="loadlevel">all links</span>';
  }

  t +='</span>';


  // map status display
  t += ' <span class="map"><b>map</b>: ';

  if (window.mapDataRequest) {
    var status = window.mapDataRequest.getStatus();

    // status.short - short description of status
    // status.long - longer description, for tooltip (optional)
    // status.progress - fractional progress (from 0 to 1; -1 for indeterminate) of current state (optional)
    if (status.long)
      t += '<span class="help" title="'+status.long+'">'+status.short+'</span>';
    else
      t += '<span>'+status.short+'</span>';

    if (status.progress !== undefined) {
      if(status.progress !== -1)
        t += ' '+Math.floor(status.progress*100)+'%';
      progress = status.progress;
    }
  } else {
    // no mapDataRequest object - no status known
    t += '...unknown...';
  }

  t += '</span>';

  //request status
  if (window.activeRequests.length > 0)
    t += ' ' + window.activeRequests.length + ' requests';
  if (window.failedRequestCount > 0)
    t += ' <span style="color:#f66">' + window.failedRequestCount + ' failed</span>'


  //it's possible that updating the status bar excessively causes some performance issues. so rather than doing it
  //immediately, delay it to the next javascript event loop, cancelling any pending update
  // will also cause any browser-related rendering to occur first, before the status actually updates

  if (window.renderUpdateStatusTimer_) clearTimeout(window.renderUpdateStatusTimer_);

  window.renderUpdateStatusTimer_ = setTimeout ( function() {
    window.renderUpdateStatusTimer_ = undefined;

    $('#innerstatus').html(t);
    //$('#updatestatus').click(function() { startRefreshTimeout(10); });
    //. <a style="cursor: pointer" onclick="startRefreshTimeout(10)" title="Refresh">⟳</a>';

    if(progress == 1 && window.activeRequests.length > 0) {
      // we don't know the exact progress, but we have requests (e.g. chat) running, so show it as indeterminate.
      progress = -1;
    }

    if (typeof android !== 'undefined' && android && android.setProgress)
      android.setProgress(progress);
  }, 0);

}


;

// UTILS + MISC  ///////////////////////////////////////////////////////

window.aboutIITC = function() {
  var v = (script_info.script && script_info.script.version || script_info.dateTimeVersion) + ' ['+script_info.buildName+']';
  if (typeof android !== 'undefined' && android && android.getVersionName) {
    v += '[IITC Mobile '+android.getVersionName()+']';
  }

  var plugins = '<ul>';
  for (var i in bootPlugins) {
    var info = bootPlugins[i].info;
    if (info) {
      var pname = info.script && info.script.name || info.pluginId;
      if (pname.substr(0,13) == 'IITC plugin: ' || pname.substr(0,13) == 'IITC Plugin: ') {
        pname = pname.substr(13);
      }
      var pvers = info.script && info.script.version || info.dateTimeVersion;

      var ptext = pname + ' - ' + pvers;
      if (info.buildName != script_info.buildName) {
        ptext += ' ['+(info.buildName||'<i>non-standard plugin</i>')+']';
      }

      plugins += '<li>'+ptext+'</li>';
    } else {
      // no 'info' property of the plugin setup function - old plugin wrapper code
      // could attempt to find the "window.plugin.NAME = function() {};" line it's likely to have..?
      plugins += '<li>(unknown plugin: index '+i+')</li>';
    }
  }
  plugins += '</ul>';

  var attrib = '<p>This project is licensed under the permissive <a href="http://www.isc.org/downloads/software-support-policy/isc-license/">ISC license</a>. Parts imported from other projects remain under their respective licenses:</p>\n\n<ul>\n<li><a href="https://github.com/bryanwoods/autolink-js">autolink-js by Bryan Woods; MIT</a></li>\n<li><a href="https://github.com/chriso/load.js">load.js by Chris O\'Hara; MIT</a></li>\n<li><a href="http://leafletjs.com/">leaflet.js; custom license (but appears free)</a></li>\n<li><a href="https://github.com/Leaflet/Leaflet.draw">leaflet.draw.js by jacobtoye; MIT</a></li>\n<li>\n<a href="https://github.com/shramov/leaflet-plugins">leaflet_google.js by Pavel Shramov; same as Leaflet</a> (modified, though)</li>\n<li><a href="https://github.com/jeromeetienne/jquery-qrcode">jquery.qrcode.js by Jerome Etienne; MIT</a></li>\n<li><a href="https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet">oms.min.js by George MacKerron; MIT</a></li>\n<li><a href="https://github.com/richadams/jquery-taphold">taphold.js by Rich Adams; unknown</a></li>\n<li><a href="https://github.com/kartena/Leaflet.Pancontrol">L.Control.Pan.js by Kartena AB; same as Leaflet</a></li>\n<li><a href="https://github.com/kartena/Leaflet.zoomslider">L.Control.Zoomslider.js by Kartena AB; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">KML.js by shramov; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">leaflet.filelayer.js by shramov; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">togeojson.js by shramov; same as Leaflet</a></li>\n<li>StackOverflow-CopyPasta is attributed in the source; <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-Wiki</a>\n</li>\n<li>all Ingress/Niantic related stuff obviously remains non-free and is still copyrighted by Niantic/Google</li>\n</ul>\n';
  var contrib = '<p>So far, these people have contributed:</p>\n\n<p><a href="https://github.com/Bananeweizen">Bananeweizen</a>,\n<a href="https://github.com/blakjakau">blakjakau</a>,\n<a href="https://github.com/boombuler">boombuler</a>,\n<a href="https://github.com/breunigs">breunigs</a>,\n<a href="https://github.com/cathesaurus">cathesaurus</a>,\n<a href="https://github.com/ccjon">ccjon</a>,\n<a href="https://github.com/cmrn">cmrn</a>,\n<a href="https://github.com/epf">epf</a>,\n<a href="https://github.com/fkloft">fkloft</a>,\n<a href="https://github.com/Fragger">Fragger</a>,\n<a href="https://github.com/hastarin">hastarin</a>,\n<a href="https://github.com/integ3r">integ3r</a>,\n<a href="https://github.com/j16sdiz">j16sdiz</a>,\n<a href="https://github.com/JasonMillward">JasonMillward</a>,\n<a href="https://github.com/jonatkins">jonatkins</a>,\n<a href="https://github.com/leCradle">leCradle</a>,\n<a href="https://github.com/Merovius">Merovius</a>,\n<a href="https://github.com/mledoze">mledoze</a>,\n<a href="https://github.com/OshiHidra">OshiHidra</a>,\n<a href="https://github.com/phoenixsong6">phoenixsong6</a>,\n<a href="https://github.com/Pirozek">Pirozek</a>,\n<a href="https://github.com/saithis">saithis</a>,\n<a href="https://github.com/Scrool">Scrool</a>,\n<a href="https://github.com/sorgo">sorgo</a>,\n<a href="https://github.com/tpenner">tpenner</a>,\n<a href="https://github.com/vita10gy">vita10gy</a>,\n<a href="https://github.com/Xelio">Xelio</a>,\n<a href="https://github.com/ZauberNerd">ZauberNerd</a>,\n<a href="https://github.com/waynn">waynn</a></p>\n'

  var a = ''
  + '  <div><b>About IITC</b></div> '
  + '  <div>Ingress Intel Total Conversion</div> '
  + '  <hr>'
  + '  <div>'
  + '    <a href="http://iitc.me/" target="_blank">IITC Homepage</a><br />'
  + '     On the script’s homepage you can:'
  + '     <ul>'
  + '       <li>Find Updates</li>'
  + '       <li>Get Plugins</li>'
  + '       <li>Report Bugs</li>'
  + '       <li>Contribute!</li>'
  + '     </ul>'
  + '  </div>'
  + '  <div>'
  + '    MapQuest OSM tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">'
  + '  </div>'
  + '  <hr>'
  + '  <div>Version: ' + v + '</div>'
  + '  <div>Plugins: ' + plugins + '</div>'
  + '  <hr>'
  + '  <div>' + attrib + '</div>'
  + '  <hr>'
  + '  <div>' + contrib + '</div>';

  dialog({
    title: 'IITC ' + v,
    html: a,
    dialogClass: 'ui-dialog-aboutIITC'
  });
}


window.layerGroupLength = function(layerGroup) {
  var layersCount = 0;
  var layers = layerGroup._layers;
  if (layers)
    layersCount = Object.keys(layers).length;
  return layersCount;
}

// retrieves parameter from the URL?query=string.
window.getURLParam = function(param) {
  var items = window.location.search.substr(1).split('&');
  if (items == "") return "";

  for (var i=0; i<items.length; i++) {
    var item = items[i].split('=');

    if (item[0] == param) {
      var val = item.length==1 ? '' : decodeURIComponent (item[1].replace(/\+/g,' '));
      return val;
    }
  }

  return '';
}

// read cookie by name.
// http://stackoverflow.com/a/5639455/1684530 by cwolves
window.readCookie = function(name){
  var C, i, c = document.cookie.split('; ');
  var cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = unescape(C[1]);
  }
  return cookies[name];
}

window.writeCookie = function(name, val) {
  var d = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = name + "=" + val + '; expires='+d+'; path=/';
}

window.eraseCookie = function(name) {
  document.cookie = name + '=; expires=Thu, 1 Jan 1970 00:00:00 GMT; path=/';
}

//certain values were stored in cookies, but we're better off using localStorage instead - make it easy to convert
window.convertCookieToLocalStorage = function(name) {
  var cookie=readCookie(name);
  if(cookie !== undefined) {
    console.log('converting cookie '+name+' to localStorage');
    if(localStorage[name] === undefined) {
      localStorage[name] = cookie;
    }
    eraseCookie(name);
  }
}

// add thousand separators to given number.
// http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
window.digits = function(d) {
  // U+2009 - Thin Space. Recommended for use as a thousands separator...
  // https://en.wikipedia.org/wiki/Space_(punctuation)#Table_of_spaces
  return (d+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1&#8201;");
}


window.zeroPad = function(number,pad) {
  number = number.toString();
  var zeros = pad - number.length;
  return Array(zeros>0?zeros+1:0).join("0") + number;
}


// converts javascript timestamps to HH:mm:ss format if it was today;
// otherwise it returns YYYY-MM-DD
window.unixTimeToString = function(time, full) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var time = d.toLocaleTimeString();
//  var time = zeroPad(d.getHours(),2)+':'+zeroPad(d.getMinutes(),2)+':'+zeroPad(d.getSeconds(),2);
  var date = d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2);
  if(typeof full !== 'undefined' && full) return date + ' ' + time;
  if(d.toDateString() == new Date().toDateString())
    return time;
  else
    return date;
}

// converts a javascript time to a precise date and time (optionally with millisecond precision)
// formatted in ISO-style YYYY-MM-DD hh:mm:ss.mmm - but using local timezone
window.unixTimeToDateTimeString = function(time, millisecond) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  return d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2)
    +' '+zeroPad(d.getHours(),2)+':'+zeroPad(d.getMinutes(),2)+':'+zeroPad(d.getSeconds(),2)+(millisecond?'.'+zeroPad(d.getMilliseconds(),3):'');
}

window.unixTimeToHHmm = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var h = '' + d.getHours(); h = h.length === 1 ? '0' + h : h;
  var s = '' + d.getMinutes(); s = s.length === 1 ? '0' + s : s;
  return  h + ':' + s;
}

window.formatInterval = function(seconds,maxTerms) {

  var d = Math.floor(seconds / 86400);
  var h = Math.floor((seconds % 86400) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;

  var terms = [];
  if (d > 0) terms.push(d+'d');
  if (h > 0) terms.push(h+'h');
  if (m > 0) terms.push(m+'m');
  if (s > 0 || terms.length==0) terms.push(s+'s');

  if (maxTerms) terms = terms.slice(0,maxTerms);

  return terms.join(' ');
}


window.rangeLinkClick = function() {
  if(window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
  if(window.isSmartphone())
    window.show('map');
}

window.showPortalPosLinks = function(lat, lng, name) {
  var encoded_name = 'undefined';
  if(name !== undefined) {
    encoded_name = encodeURIComponent(name);
  }

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    android.intentPosLink(lat, lng, map.getZoom(), name, true);
  } else {
    var qrcode = '<div id="qrcode"></div>';
    var script = '<script>$(\'#qrcode\').qrcode({text:\'GEO:'+lat+','+lng+'\'});</script>';
    var gmaps = '<a href="https://maps.google.com/maps?ll='+lat+','+lng+'&q='+lat+','+lng+'%20('+encoded_name+')">Google Maps</a>';
    var bingmaps = '<a href="http://www.bing.com/maps/?v=2&cp='+lat+'~'+lng+'&lvl=16&sp=Point.'+lat+'_'+lng+'_'+encoded_name+'___">Bing Maps</a>';
    var osm = '<a href="http://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'&zoom=16">OpenStreetMap</a>';
    var latLng = '<span>&lt;' + lat + ',' + lng +'&gt;</span>';
    dialog({
      html: '<div style="text-align: center;">' + qrcode + script + gmaps + '; ' + bingmaps + '; ' + osm + '<br />' + latLng + '</div>',
      title: name,
      id: 'poslinks'
    });
  }
}

window.isTouchDevice = function() {
  return 'ontouchstart' in window // works on most browsers
      || 'onmsgesturechange' in window; // works on ie10
};

window.androidCopy = function(text) {
  if(typeof android === 'undefined' || !android || !android.copy)
    return true; // i.e. execute other actions
  else
    android.copy(text);
  return false;
}

window.androidPermalink = function() {
  if(typeof android === 'undefined' || !android || !android.intentPosLink)
    return true; // i.e. execute other actions

  var center = map.getCenter();
  android.intentPosLink(center.lat, center.lng, map.getZoom(), "Selected map view", false);
  return false;
}



window.getMinPortalLevel = function() {
  var z = map.getZoom();
  z = getDataZoomForMapZoom(z);
  return getMapZoomTileParameters(z).level;
}

// returns number of pixels left to scroll down before reaching the
// bottom. Works similar to the native scrollTop function.
window.scrollBottom = function(elm) {
  if(typeof elm === 'string') elm = $(elm);
  return elm.get(0).scrollHeight - elm.innerHeight() - elm.scrollTop();
}

window.zoomToAndShowPortal = function(guid, latlng) {
  map.setView(latlng, 17);
  // if the data is available, render it immediately. Otherwise defer
  // until it becomes available.
  if(window.portals[guid])
    renderPortalDetails(guid);
  else
    urlPortal = guid;
}

window.selectPortalByLatLng = function(lat, lng) {
  if(lng === undefined && lat instanceof Array) {
    lng = lat[1];
    lat = lat[0];
  } else if(lng === undefined && lat instanceof L.LatLng) {
    lng = lat.lng;
    lat = lat.lat;
  }
  for(var guid in window.portals) {
    var latlng = window.portals[guid].getLatLng();
    if(latlng.lat == lat && latlng.lng == lng) {
      renderPortalDetails(guid);
      return;
    }
  }

  // not currently visible
  urlPortalLL = [lat, lng];
  map.setView(urlPortalLL, 17);
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// http://stackoverflow.com/a/646643/1684530 by Bergi and CMS
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

// escape a javascript string, so quotes and backslashes are escaped with a backslash
// (for strings passed as parameters to html onclick="..." for example)
window.escapeJavascriptString = function(str) {
  return (str+'').replace(/[\\"']/g,'\\$&');
}

//escape special characters, such as tags
window.escapeHtmlSpecialChars = function(str) {
  var div = document.createElement(div);
  var text = document.createTextNode(str);
  div.appendChild(text);
  return div.innerHTML;
}

window.prettyEnergy = function(nrg) {
  return nrg> 1000 ? Math.round(nrg/1000) + ' k': nrg;
}

window.setPermaLink = function(elm) {
  var c = map.getCenter();
  var lat = Math.round(c.lat*1E6)/1E6;
  var lng = Math.round(c.lng*1E6)/1E6;
  var qry = 'll='+lat+','+lng+'&z=' + map.getZoom();
  $(elm).attr('href',  '/intel?' + qry);
}

window.uniqueArray = function(arr) {
  return $.grep(arr, function(v, i) {
    return $.inArray(v, arr) === i;
  });
}

window.genFourColumnTable = function(blocks) {
  var t = $.map(blocks, function(detail, index) {
    if(!detail) return '';
    var title = detail[2] ? ' title="'+escapeHtmlSpecialChars(detail[2]) + '"' : '';
    if(index % 2 === 0)
      return '<tr><td'+title+'>'+detail[1]+'</td><th'+title+'>'+detail[0]+'</th>';
    else
      return '    <th'+title+'>'+detail[0]+'</th><td'+title+'>'+detail[1]+'</td></tr>';
  }).join('');
  if(t.length % 2 === 1) t + '<td></td><td></td></tr>';
  return t;
}


// converts given text with newlines (\n) and tabs (\t) to a HTML
// table automatically.
window.convertTextToTableMagic = function(text) {
  // check if it should be converted to a table
  if(!text.match(/\t/)) return text.replace(/\n/g, '<br>');

  var data = [];
  var columnCount = 0;

  // parse data
  var rows = text.split('\n');
  $.each(rows, function(i, row) {
    data[i] = row.split('\t');
    if(data[i].length > columnCount) columnCount = data[i].length;
  });

  // build the table
  var table = '<table>';
  $.each(data, function(i, row) {
    table += '<tr>';
    $.each(data[i], function(k, cell) {
      var attributes = '';
      if(k === 0 && data[i].length < columnCount) {
        attributes = ' colspan="'+(columnCount - data[i].length + 1)+'"';
      }
      table += '<td'+attributes+'>'+cell+'</td>';
    });
    table += '</tr>';
  });
  table += '</table>';
  return table;
}

// Given 3 sets of points in an array[3]{lat, lng} returns the area of the triangle
window.calcTriArea = function(p) {
  return Math.abs((p[0].lat*(p[1].lng-p[2].lng)+p[1].lat*(p[2].lng-p[0].lng)+p[2].lat*(p[0].lng-p[1].lng))/2);
}

// Update layerGroups display status to window.overlayStatus and localStorage 'ingress.intelmap.layergroupdisplayed'
window.updateDisplayedLayerGroup = function(name, display) {
  overlayStatus[name] = display;
  localStorage['ingress.intelmap.layergroupdisplayed'] = JSON.stringify(overlayStatus);
}

// Read layerGroup status from window.overlayStatus if it was added to map,
// read from cookie if it has not added to map yet.
// return 'defaultDisplay' if both overlayStatus and cookie didn't have the record
window.isLayerGroupDisplayed = function(name, defaultDisplay) {
  if(typeof(overlayStatus[name]) !== 'undefined') return overlayStatus[name];

  convertCookieToLocalStorage('ingress.intelmap.layergroupdisplayed');
  var layersJSON = localStorage['ingress.intelmap.layergroupdisplayed'];
  if(!layersJSON) return defaultDisplay;

  var layers = JSON.parse(layersJSON);
  // keep latest overlayStatus
  overlayStatus = $.extend(layers, overlayStatus);
  if(typeof(overlayStatus[name]) === 'undefined') return defaultDisplay;
  return overlayStatus[name];
}

window.addLayerGroup = function(name, layerGroup, defaultDisplay) {
  if (defaultDisplay === undefined) defaultDisplay = true;

  if(isLayerGroupDisplayed(name, defaultDisplay)) map.addLayer(layerGroup);
  layerChooser.addOverlay(layerGroup, name);
}

window.removeLayerGroup = function(layerGroup) {
  if(!layerChooser._layers[layerGroup._leaflet_id]) throw('Layer was not found');
  // removing the layer will set it's default visibility to false (store if layer gets added again)
  var name = layerChooser._layers[layerGroup._leaflet_id].name;
  var enabled = isLayerGroupDisplayed(name);
  map.removeLayer(layerGroup);
  layerChooser.removeLayer(layerGroup);
  updateDisplayedLayerGroup(name, enabled);
};

window.clampLat = function(lat) {
  // the map projection used does not handle above approx +- 85 degrees north/south of the equator
  if (lat > 85.051128)
    lat = 85.051128;
  else if (lat < -85.051128)
    lat = -85.051128;
  return lat;
}

window.clampLng = function(lng) {
  if (lng > 179.999999)
    lng = 179.999999;
  else if (lng < -180.0)
    lng = -180.0;
  return lng;
}


window.clampLatLng = function(latlng) {
  return new L.LatLng ( clampLat(latlng.lat), clampLng(latlng.lng) );
}

window.clampLatLngBounds = function(bounds) {
  return new L.LatLngBounds ( clampLatLng(bounds.getSouthWest()), clampLatLng(bounds.getNorthEast()) );
}

window.getGenericMarkerSvg = function(color) {
  var markerTemplate = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"\n	version="1.1" baseProfile="full"\n	width="25px" height="41px" viewBox="0 0 25 41">\n\n	<path d="M1.36241844765,18.67488124675 A12.5,12.5 0 1,1 23.63758155235,18.67488124675 L12.5,40.5336158073 Z" style="stroke:none; fill: %COLOR%;" />\n	<path d="M1.80792170975,18.44788599685 A12,12 0 1,1 23.19207829025,18.44788599685 L12.5,39.432271175 Z" style="stroke:#000000; stroke-width:1px; stroke-opacity: 0.15; fill: none;" />\n	<path d="M2.921679865,17.8803978722 A10.75,10.75 0 1,1 22.078320135,17.8803978722 L12.5,36.6789095943 Z" style="stroke:#ffffff; stroke-width:1.5px; stroke-opacity: 0.35; fill: none;" />\n\n	<path d="M19.86121593215,17.25 L12.5,21.5 L5.13878406785,17.25 L5.13878406785,8.75 L12.5,4.5 L19.86121593215,8.75 Z M7.7368602792,10.25 L17.2631397208,10.25 L12.5,18.5 Z M12.5,13 L7.7368602792,10.25 M12.5,13 L17.2631397208,10.25 M12.5,13 L12.5,18.5 M19.86121593215,17.25 L16.39711431705,15.25 M5.13878406785,17.25 L8.60288568295,15.25 M12.5,4.5 L12.5,8.5" style="stroke:#ffffff; stroke-width:1.25px; stroke-opacity: 1; fill: none;" />\n\n</svg>';

  return markerTemplate.replace(/%COLOR%/g, color);
}

window.getGenericMarkerIcon = function(color,className) {
  return L.divIcon({
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    html: getGenericMarkerSvg(color),
    className: className || 'leaflet-iitc-divicon-generic-marker'
  });
}

window.createGenericMarker = function(ll,color,options) {
  options = options || {};

  var markerOpt = $.extend({
    icon: getGenericMarkerIcon(color || '#a24ac3')
  }, options);

  return L.marker(ll, markerOpt);
}



// Fix Leaflet: handle touchcancel events in Draggable
L.Draggable.prototype._onDownOrig = L.Draggable.prototype._onDown;
L.Draggable.prototype._onDown = function(e) {
  L.Draggable.prototype._onDownOrig.apply(this, arguments);

  if(e.type === "touchstart") {
    L.DomEvent.on(document, "touchcancel", this._onUp, this);
  }
}




} // end of wrapper

// inject code into site context
var script = document.createElement('script');
var info = { buildName: 'local', dateTimeVersion: '20161015.53955' };
if (this.GM_info && this.GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
