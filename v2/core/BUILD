load("//tools:typescript.bzl", "ts_library")
load("//tools:iitc.bzl", "iitc_binary")


IITC_VERSION = '0.25.2'

ts_library(
    name="iitc_typedecls",
    srcs=glob(["**/*.d.ts"]),
)

ts_library(
    name="iitc_lib",
    srcs=glob(["**/*.ts"], exclude=["*.d.ts"]),
)

# Production build
iitc_binary(
    name="iitc",
    deps=[
        ":iitc_lib",
        ":iitc_typedecls",
    ],
    version=IITC_VERSION,
    mode="strict",
)

# Development build: no minfication
iitc_binary(
    name="iitc.dev",
    deps=[
        ":iitc_lib",
        ":iitc_typedecls",
    ],
    version=IITC_VERSION,
    mode="dev",
)

# Loose build: less strict than production
iitc_binary(
    name="iitc.loose",
    deps=[
        ":iitc_lib",
        ":iitc_typedecls",
    ],
    version=IITC_VERSION,
    mode="loose",
)
