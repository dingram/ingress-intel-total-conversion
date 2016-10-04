load("//tools:iitc.bzl", "iitc_js_plugin", "iitc_ts_plugin", "DOWNLOAD_URLS")
load(":build_defs/registry.bzl", "lookup_plugin")


_FLAVOR_TO_MODE = {
    'release': 'strict',
    'test': 'strict',
    'exp': 'loose',
    'dev': 'dev',
}
_NAME_SUFFIX = {
    'release': '',
}


def FindPluginSourceFiles():
  return struct(
    js_rootnames = [f[:-3] for f in native.glob(["*.js"])],
    ts_rootnames = [f[:-3] for f in native.glob(["*.ts"], exclude=["*.d.ts"])],
  )


def GeneratePluginTargets(flavors):
  source_files = FindPluginSourceFiles()
  all_rootnames = source_files.js_rootnames + source_files.ts_rootnames

  for flavor in flavors:
    name_suffix = _NAME_SUFFIX.get(flavor, ".%s" % flavor)
    # Pure JavaScript plugins
    for f in source_files.js_rootnames:
      iitc_js_plugin(
          name=f + name_suffix,
          srcs=["%s.js" % f],
          metadata=lookup_plugin(f),
          mode=_FLAVOR_TO_MODE[flavor],
          base_url=DOWNLOAD_URLS.get(flavor, None),
      )

    # TypeScript plugins
    for f in source_files.ts_rootnames:
      iitc_ts_plugin(
          name=f + name_suffix,
          srcs=["%s.ts" % f],
          deps=[
              "//core:typedecls",
              "//core:iitc%s_typedecl" % name_suffix,
          ],
          metadata=lookup_plugin(f),
          mode=_FLAVOR_TO_MODE[flavor],
          base_url=DOWNLOAD_URLS.get(flavor, None),
      )

    # Group the resulting files together
    native.filegroup(
        name="all_plugins" + name_suffix,
        srcs=[":%s%s" % (f, name_suffix) for f in all_rootnames],
        visibility=["//:__pkg__"],
    )
