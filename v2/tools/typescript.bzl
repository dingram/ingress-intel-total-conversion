js_filetype = FileType(['.js'])
ts_filetype = FileType(['.ts'])

def get_transitive_files(ctx):
  s = set()
  for dep in ctx.attr.deps:
    s += dep.transitive_files
  s += ctx.files.srcs
  return s

def js_library_impl(ctx):
  return struct(
      files=set(),
      transitive_files=get_transitive_files(ctx))

def ts_library_impl(ctx):
  return struct(
      files=set(),
      transitive_files=get_transitive_files(ctx))

def ts_binary_impl(ctx):
  files = list(get_transitive_files(ctx))
  output = ctx.outputs.out
  output_defs = ctx.outputs.defs
  output_map = ctx.outputs.sourcemap

  flags = ['%s' % f for f in ctx.attr.flags]
  if ctx.attr.remove_comments:
    flags.append('--removeComments')
  if ctx.attr.strict_nulls:
    flags.append('--strictNullChecks')
  if ctx.attr.source_root:
    flags += ['--sourceRoot', ctx.attr.source_root]

  if ctx.attr.super_strict:
    flags += [
        '--noFallthroughCasesInSwitch',
        '--noImplicitAny',
        '--noImplicitReturns',
        '--noImplicitThis',
        '--noUnusedLocals',
        '--noUnusedParameters',
    ]

  ctx.action(
      inputs=files,
      outputs=[output, output_defs, output_map],
      command='tsc %s -d --sourceMap --out %s %s' % (
          ' '.join(flags), output.path, ' '.join([f.path for f in files])),
      progress_message='Transpiling TypeScript to create %s' % output.basename,
  )

js_library = rule(
  implementation = js_library_impl,
  attrs = {
      'srcs': attr.label_list(allow_files=js_filetype),
      'deps': attr.label_list(allow_files=False),
  },
)

ts_library = rule(
  implementation = ts_library_impl,
  attrs = {
      'srcs': attr.label_list(allow_files=ts_filetype),
      'deps': attr.label_list(allow_files=False),
  },
)

ts_binary = rule(
    implementation = ts_binary_impl,
    attrs = {
        'deps': attr.label_list(allow_files=True),
        'srcs': attr.label_list(allow_files=ts_filetype),
        'flags': attr.string_list(),
        'remove_comments': attr.bool(),
        'strict_nulls': attr.bool(default=True),
        'source_root': attr.string(),
        'super_strict': attr.bool(),
    },
    outputs = {
        'defs': '%{name}.d.ts',
        'out': '%{name}.js',
        'sourcemap': '%{name}.js.map',
    }
)
