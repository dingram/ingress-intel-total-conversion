load("//tools:typescript.bzl", "ts_library")
load("//tools:iitc.bzl", "iitc_binary")

package_group(
    name="visibility",
    packages=["//core/..."],
)


IITC_VERSION = '1.99.9'
ASSETS = [
    "assets/css/style.css",
    "assets/images/current-location.png",
]

ts_library(
    name="typedecls",
    srcs=glob(["**/*.d.ts"]),
    deps=[
        "//third_party/typedecls",
    ],
    visibility=["//visibility:public"],
)

ts_library(
    name="iitc_lib",
    srcs=glob(["**/*.ts"], exclude=["*.d.ts"]),
    deps=[
        ":typedecls",
        "@loadjs//:loadjs",
    ],
)

ts_library(
    name="iitc_typedecl",
    srcs=[":iitc.d.ts"],
    visibility=["//visibility:public"],
)

# Production build
iitc_binary(
    name="iitc",
    deps=[":iitc_lib"],
    assets=ASSETS,
    version=IITC_VERSION,
    mode="strict",
    visibility=["//:__pkg__"],
)

# Development build: no minfication
iitc_binary(
    name="iitc.dev",
    deps=[":iitc_lib"],
    assets=ASSETS,
    version=IITC_VERSION,
    mode="dev",
)

# Loose build: less strict than production
iitc_binary(
    name="iitc.loose",
    deps=[":iitc_lib"],
    assets=ASSETS,
    version=IITC_VERSION,
    mode="loose",
)

# Experimental build
iitc_binary(
    name="iitc-exp",
    deps=[":iitc_lib"],
    assets=ASSETS,
    version=IITC_VERSION,
    mode="strict",
    base_url="https://experimental.iitc.me/v2/",
)

# Upload experimental build
genrule(
    name="upload-exp",
    outs=["upload-exp.sh"],
    srcs=[":iitc-exp"],
    cmd='echo "#!/bin/bash\nset +x\ngsutil -m -h Cache-Control:private,\\ max-age=0,\\ no-transform cp -z js,ts -a public-read $(SRCS) gs://experimental.iitc.me/v2/" > $@',
    executable=1,
    output_to_bindir=1,
    visibility=["//:__pkg__"],
)
