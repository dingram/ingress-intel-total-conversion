load("//tools:iitc.bzl", "iitc_js_plugin", "iitc_ts_plugin")
load(":registry.bzl", "lookup_plugin")

[
    [iitc_ts_plugin(
        name=f[:-3] + ("" if m == "strict" else (".%s" % m)),
        srcs=[f],
        deps=["//core:typedecls"],
        metadata=lookup_plugin(f[:-3]),
        mode=m,
    ) for m in ["strict", "dev"]]
for f in glob(["*.ts"], exclude=["*.d.ts"])]

[
    [iitc_js_plugin(
        name=f[:-3] + ("" if m == "strict" else (".%s" % m)),
        srcs=[f],
        metadata=lookup_plugin(f[:-3]),
        mode=m,
    ) for m in ["strict", "dev"]]
for f in glob(["*.js"])]
