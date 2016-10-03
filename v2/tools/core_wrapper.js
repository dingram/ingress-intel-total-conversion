if (document.getElementsByTagName('html')[0].getAttribute('itemscope') != null) {
  throw('Ingress Intel Website is down, not a userscript issue.');
}

// Disable original page JS.
window.onload = function() {};
document.body.onload = function() {};

// Originally code here parsed the <script> tags from the page to find the one
// that defined the PLAYER object.  However, that's already been executed, so
// we can just access PLAYER - no messing around needed!

if (typeof(window.PLAYER)!="object" || typeof(window.PLAYER.nickname) != "string") {
  // Page doesn't have a script tag with player information.
  if (document.getElementById('header_email')) {
    // However, we are logged in.  It used to be regularly common to get
    // temporary 'account not enabled' messages from the intel site.  However,
    // this is no longer common. More common is users getting account
    // suspended/banned - and this currently shows the 'not enabled' message.
    // so it's safer to not repeatedly reload in this case.
    throw "Page doesn't have player data, but you are logged in." ;
  }
  // FIXME: handle "NIA takedown in progress"
  throw "Couldn't retrieve player data. Are you logged in?" ;
}

// Putting everything in a wrapper function that in turn is placed in a
// <script> tag on the website allows us to execute in the site's context
// instead of in the Greasemonkey/Extension/etc. context.
function wrapper(info) {
// START OF WRAPPER

'@@WRAPPED_CODE@@';

// Let's get this show on the road.
(window.iitc = iitc).bootstrap.init();

// END OF WRAPPER
}

// Prepare script information.
var info = {
  buildName: '@@BUILDNAME@@',
  dateTimeVersion: '@@DATETIMEVERSION@@'
};

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
