js_filetype = FileType(['.js'])
js_map_filetype = FileType(['.js.map'])

def get_transitive_files(ctx):
  s = set()
  for dep in ctx.attr.deps:
    s += dep.files
  s += ctx.files.srcs
  return s

def uglify_js_impl(ctx):
  all_files = list(get_transitive_files(ctx))
  source_files = [f for f in all_files if f.basename.endswith('.js')]
  map_files = [f for f in all_files if f.basename.endswith('.js.map')]

  output = ctx.outputs.out
  outputs = [output]
  output_map = None
  if hasattr(ctx.outputs, 'sourcemap'):
    output_map = ctx.outputs.sourcemap
    outputs.append(output_map)

  flags = [
      '-c',
  ]
  flags += ['%s' % f for f in ctx.attr.flags]
  if ctx.attr.source_map:
    flags += ['--in-source-map', ctx.file.source_map.path]
  for source_map in map_files:
    flags += ['--in-source-map', source_map.path]
  if ctx.attr.source_root:
    flags += ['--source-map-root', ctx.file.source_map.path]

  if output_map:
    flags += ['--source_map', '%s' % output_map.path]
  flags += ['-o', '%s' % output.path]

  ctx.action(
      inputs=all_files,
      outputs=outputs,
      command='uglifyjs %s %s' % (' '.join(flags), ' '.join([f.path for f in source_files])),
  )

def _uglify_js_outputs(generate_source_map):
  outputs = {
      'out': '%{name}.js',
  }
  if generate_source_map:
    outputs['sourcemap'] = '%{name}.js.map'
  return outputs

uglify_js = rule(
    implementation = uglify_js_impl,
    attrs = {
        'deps': attr.label_list(allow_files=js_filetype),
        'srcs': attr.label_list(allow_files=js_filetype),
        'flags': attr.string_list(),
        'source_root': attr.string(),
        'source_map': attr.label(allow_files=js_map_filetype),
        'generate_source_map': attr.bool(),
    },
    outputs = _uglify_js_outputs,
)
