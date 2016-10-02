# Upload experimental core + plugin builds
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=["//core:upload-exp", "//plugins:upload-exp"],
    cmd='echo "#!/bin/bash\nset +x\n$(location //core:upload-exp)\n$(location //plugins:upload-exp)" > $@',
    executable=1,
    output_to_bindir=1,
)

# Build all files for distribution
filegroup(
    name="dist",
    srcs=["//core:iitc", "//plugins:all_plugins"],
)

# Bundle files for distribution
genrule(
    name="dist_tarball",
    srcs=[":dist"],
    outs=["iitc-dist.tar.xz"],
    cmd='tar -cJvf $@ --transform="s,^.*/,," $(SRCS)',
)

genrule(
    name="dist_zip",
    srcs=[":dist"],
    outs=["iitc-dist.zip"],
    cmd='zip -j9 $@ $(SRCS)',
)
