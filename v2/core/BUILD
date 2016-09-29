load("//tools:typescript.bzl", "ts_binary", "ts_library")
load("//tools:uglify_js.bzl", "uglify_js")
load("//tools:userjs.bzl", "userscript_binary")
load("//tools:iitc.bzl", "iitc_plugin")

package_group(
    name="visibility",
    packages=["//core/..."],
)


IITC_VERSION = '0.25.2'


ts_library(
    name="iitc_lib",
    deps=[
        "//core/bootstrap",
        "//core/data",
        "//core/events",
        "//core/gameinfo",
        "//core/ingress",
        "//core/map",
        "//core/mobile",
        "//core/plugins",
        "//core/ui",
        "//core/util",
    ],
)

ts_binary(
    name="iitc_raw",
    deps=[":iitc_lib"],
    remove_comments=False,
)

ts_binary(
    name="iitc_strict",
    deps=[":iitc_lib"],
    remove_comments=False,
    super_strict=True,
)

ts_binary(
    name="iitc_build",
    deps=[":iitc_lib"],
    remove_comments=True,
)

uglify_js(
    name="iitc_uglified",
    deps=[":iitc_build"],
)

iitc_plugin(
    name="iitc",
    base=":iitc_uglified",

    # metadata
    id='ingress-intel-total-conversion@jonatkins',
    title='IITC: Ingress intel map total conversion',
    version=IITC_VERSION,
    description='Total conversion for the Ingress intel map.',
)

iitc_plugin(
    name="iitc-dev",
    base=":iitc_raw",

    # metadata
    id='ingress-intel-total-conversion@jonatkins',
    title='IITC: Ingress intel map total conversion (dev build)',
    version=IITC_VERSION,
    description='Total conversion for the Ingress intel map.',
)
