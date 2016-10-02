# Upload experimental core + plugin builds
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=["//core:upload-exp", "//plugins:upload-exp"],
    cmd='echo "#!/bin/bash\nset +x\n$(location //core:upload-exp)\n$(location //plugins:upload-exp)" > $@',
    executable=1,
    output_to_bindir=1,
)
