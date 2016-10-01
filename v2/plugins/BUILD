load("//tools:iitc.bzl", "iitc_js_plugin", "iitc_ts_plugin")
load(":registry.bzl", "lookup_plugin")


TS_ROOTNAMES = [f[:-3] for f in glob(["*.ts"], exclude=["*.d.ts"])]
JS_ROOTNAMES = [f[:-3] for f in glob(["*.js"])]
ALL_ROOTNAMES = TS_ROOTNAMES + JS_ROOTNAMES

# Typescript plugins
[
    [iitc_ts_plugin(
        name=f + ("" if m == "strict" else (".%s" % m)),
        srcs=["%s.ts" % f],
        deps=[
            "//core:typedecls",
            "//core:iitc_typedecl",
        ],
        metadata=lookup_plugin(f),
        mode="strict" if m == "exp" else m,
        base_url="https://experimental.iitc.me/v2/" if m == "exp" else None,
    ) for m in ["strict", "dev", "exp"]]
for f in TS_ROOTNAMES]

# Javascript plugins
[
    [iitc_js_plugin(
        name=f + ("" if m == "strict" else (".%s" % m)),
        srcs=["%s.js" % f],
        metadata=lookup_plugin(f),
        mode="strict" if m == "exp" else m,
        base_url="https://experimental.iitc.me/v2/" if m == "exp" else None,
    ) for m in ["strict", "dev", "exp"]]
for f in JS_ROOTNAMES]

# Index page generator
sh_binary(
    name="generate_index",
    srcs=["generate_index.sh"],
)

genrule(
    name="plugin-index",
    outs=["index.html"],
    tools=[":generate_index"],
    srcs=[":%s.exp" % f for f in ALL_ROOTNAMES],
    cmd='$(location :generate_index) https://experimental.iitc.me/v2/ $(SRCS) > $@',
)

# Upload experimental plugin builds
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=[":plugin-index"] + [":%s.exp" % f for f in ALL_ROOTNAMES],
    cmd='echo "#!/bin/bash\nset +x\ngsutil -m -h Cache-Control:private,\\ max-age=0,\\ no-transform cp -z js,ts,html -a public-read $(SRCS) gs://experimental.iitc.me/v2/\ngsutil setmeta -h Content-Type:text/plain gs://experimental.iitc.me/v2/\\*.d.ts" > $@',
    executable=1,
    output_to_bindir=1,
)
