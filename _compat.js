// COMPAT HELPERS //////////////////////////////////////////////////////
if(typeof window.iitc.compat !== 'function') window.iitc.compat = {};

window.iitc.compat.warnings = {};
window.iitc.compat.makeAlias = function(alias, original) {
  if (typeof alias !== 'string') {
    throw new Error('Alias must be a string');
  }
  if (typeof original !== 'string') {
    throw new Error('Original must be a string');
  }
  if (alias.startsWith('iitc.')) {
    // catch getting things the wrong way around
    throw new Error('Alias cannot be within IITC namespace');
  }

  var _get = function(name) {
    var parts = name.split('.');
    var tmp = window;
    try {
      var x;
      while (x = parts.shift()) {
        tmp = tmp[x];
      }
      return tmp;
    } catch (e) {
      throw new Error('Cannot get value for ' + name + ': ' + e);
    }
  };
  var _set = function(name, value) {
    var parts = name.split('.');
    var tmp = window;
    try {
      var x;
      while (x = parts.shift()) {
        if (parts.length) {
          tmp = tmp[x];
        } else {
          tmp[x] = value;
        }
      }
    } catch (e) {
      throw new Error('Cannot set value for ' + name + ': ' + e);
    }
  };
  var _warnIfUnwarned = function(action, alias, original) {
    if (!iitc.compat.ENABLE_WARNINGS) return;
    var e = new Error('legacy');
    var loc = e.stack.split('\n')[3].replace(/^\s*at\s*/i, '');
    var key = action + ':' + alias + ':' + loc;
    if (key in iitc.compat.warnings) {
      return;
    }
    console.warn('PLUGIN DEVELOPERS: Please replace ' + action + ' ' + alias + ' with ' + original + ' at ' + loc);
    iitc.compat.warnings[key] = true;
  };

  Object.defineProperty(window, alias, {
    configurable: false,
    enumerable: true,
    get: function(){
      _warnIfUnwarned('use of', alias, original);
      return _get(original);
    },
    set: function(v){
      _warnIfUnwarned('assignment to', alias, original);
      _set(original, v);
    },
  });
};

window.iitc.compat.makeAliases = function(aliases) {
  Object.keys(aliases).forEach(function(key) {
    iitc.compat.makeAlias(key, aliases[key]);
  });
};
