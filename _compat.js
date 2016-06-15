// COMPAT HELPERS //////////////////////////////////////////////////////
if(typeof window.iitc.compat !== 'function') window.iitc.compat = {};

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

  Object.defineProperty(window, alias, {
    configurable: false,
    enumerable: true,
    get: function(){ return _get(original); },
    set: function(v){ _set(original, v); },
  });
};

window.iitc.compat.makeAliases = function(aliases) {
  Object.keys(aliases).forEach(function(key) {
    iitc.compat.makeAlias(key, aliases[key]);
  });
};
