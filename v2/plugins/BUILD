load(":build_defs/build_defs.bzl", "GeneratePluginTargets")


GeneratePluginTargets(
    flavors=["release", "test", "exp", "dev"],
)


# Index page generator
sh_binary(
    name="generate_index",
    srcs=["helpers/generate_index.sh"],
)

genrule(
    name="plugin-index.exp",
    outs=["index.html"],
    tools=[":generate_index"],
    srcs=[":all_plugins.exp"],
    cmd='$(location :generate_index) https://experimental.iitc.me/v2/ $(SRCS) > $@',
)

# Upload experimental plugin builds
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=[":plugin-index.exp", ":all_plugins.exp"],
    cmd='echo "#!/bin/bash\nset +x\ngsutil -m -h Cache-Control:private,\\ max-age=0,\\ no-transform cp -z js,ts,html -a public-read $(SRCS) gs://experimental.iitc.me/v2/\ngsutil setmeta -h Content-Type:text/plain gs://experimental.iitc.me/v2/\\*.d.ts" > $@',
    executable=1,
    output_to_bindir=1,
    visibility=["//:__pkg__"],
)
