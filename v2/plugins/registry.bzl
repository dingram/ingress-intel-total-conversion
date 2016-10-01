PLUGIN_REGISTRY = {
}


def _ucfirst(s):
  return s[0].upper() + s[1:]


def lookup_plugin(name):
  if name not in PLUGIN_REGISTRY:
    print('Plugin %s not found in the PLUGIN_REGISTRY in registry.bzl, using defaults' % name)

  metadata = PLUGIN_REGISTRY.get(name, {})

  return {
    'id': metadata.get('id', 'iitc-plugin-%s' % name),
    'title': metadata.get('title', 'IITC plugin: %s' % _ucfirst(name.replace('-', ' '))),
    'version': metadata.get('version', '0.0.1'),
    'description': metadata.get('description', 'IITC plugin: %s' % _ucfirst(name.replace('-', ' '))),
    'category': metadata.get('category', ''),
  }
