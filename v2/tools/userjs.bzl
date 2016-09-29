js_filetype = FileType(['.js'])

def get_transitive_files(ctx):
  s = set()
  for dep in ctx.attr.deps:
    s += dep.files
  s += ctx.files.srcs
  return s

def userscript_binary_impl(ctx):
  all_files = list(get_transitive_files(ctx))
  source_files = [f for f in all_files if f.basename.endswith('.js')]

  output = ctx.outputs.out
  output_meta = ctx.outputs.meta_out

  meta_lines = [
    '// ==UserScript==',
  ]

  if ctx.attr.id:
    meta_lines.append('// @id           %s' % ctx.attr.id)
  if ctx.attr.script_name:
    meta_lines.append('// @name         %s' % ctx.attr.script_name)
  if ctx.attr.category:
    meta_lines.append('// @category     %s' % ctx.attr.category)
  if ctx.attr.version:
    meta_lines.append('// @version      %s' % ctx.attr.version)
  if ctx.attr.namespace:
    meta_lines.append('// @namespace    %s' % ctx.attr.namespace)
  if ctx.attr.update_url:
    meta_lines.append('// @updateURL    %s' % ctx.attr.update_url)
  if ctx.attr.download_url:
    meta_lines.append('// @downloadURL  %s' % ctx.attr.download_url)
  if ctx.attr.description:
    meta_lines.append('// @description  %s' % ctx.attr.description.replace('\n', ' '))

  for i in ctx.attr.include:
    meta_lines.append('// @include      %s' % i)
  for m in ctx.attr.match:
    meta_lines.append('// @match        %s' % m)
  for g in ctx.attr.grant:
    meta_lines.append('// @grant        %s' % g)
 
  meta_lines += [
    '// ==/UserScript==',
    '',
  ]

  meta_block = '\n'.join(meta_lines)

  ctx.file_action(
      output=output_meta,
      content=meta_block,
  )

  ctx.action(
      inputs=source_files + [output_meta],
      outputs=[output],
      command='cat %s %s <(echo) > %s' % (output_meta.path, ' '.join([f.path for f in source_files]), output.path),
  )

userscript_binary = rule(
    implementation = userscript_binary_impl,
    attrs = {
        'deps': attr.label_list(allow_files=js_filetype),
        'srcs': attr.label_list(allow_files=js_filetype),

        # meta block attributes
        'id': attr.string(),
        'script_name': attr.string(),
        'category': attr.string(),
        'version': attr.string(),
        'namespace': attr.string(),
        'update_url': attr.string(),
        'download_url': attr.string(),
        'description': attr.string(),
        'include': attr.string_list(),
        'match': attr.string_list(),
        'grant': attr.string_list(default=['none']),

    },
    outputs = {
        'out': '%{name}.user.js',
        'meta_out': '%{name}.meta.js',
    },
)

