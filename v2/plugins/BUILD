load("//tools:iitc.bzl", "iitc_js_plugin", "iitc_ts_plugin")
load(":registry.bzl", "lookup_plugin")

[
    [iitc_ts_plugin(
        name=f[:-3] + ("" if m == "strict" else (".%s" % m)),
        srcs=[f],
        deps=["//core:typedecls"],
        metadata=lookup_plugin(f[:-3]),
        mode="strict" if m == "exp" else m,
        base_url="https://experimental.iitc.me/v2/" if m == "exp" else None,
    ) for m in ["strict", "dev", "exp"]]
for f in glob(["*.ts"], exclude=["*.d.ts"])]

[
    [iitc_js_plugin(
        name=f[:-3] + ("" if m == "strict" else (".%s" % m)),
        srcs=[f],
        metadata=lookup_plugin(f[:-3]),
        mode="strict" if m == "exp" else m,
        base_url="https://experimental.iitc.me/v2/" if m == "exp" else None,
    ) for m in ["strict", "dev", "exp"]]
for f in glob(["*.js"])]

# Upload experimental build
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=([":%s.exp" % f[:-3] for f in glob(["*.ts"], exclude=["*.d.ts"])]
          + [":%s.exp" % f[:-3] for f in glob(["*.js"])]),
    cmd='echo "#!/bin/bash\nset +x\ngsutil -m cp $(SRCS) gs://experimental.iitc.me/v2/" > $@',
    executable=1,
    output_to_bindir=1,
)
