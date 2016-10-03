load("//tools:typescript.bzl", "ts_binary", "ts_library")
load("//tools:uglify_js.bzl", "uglify_js")
load("//tools:userjs.bzl", "userscript_binary")

DOWNLOAD_URLS = {
  'release': 'https://static.iitc.me/build/release/',
  'test': 'https://static.iitc.me/build/test/',
  'exp': 'https://experimental.iitc.me/v2/',
}


js_filetype = FileType(['.js'])
ts_filetype = FileType(['.ts'])
ts_decl_filetype = FileType(['.d.ts'])
js_or_ts_filetype = FileType(['.js', '.ts'])
js_map_filetype = FileType(['.js.map'])
userscript_filetype = FileType(['.user.js', '.meta.js'])


########################################################################
# Helper functions
########################################################################
def _intermediate_file(ctx, filename):
  return ctx.new_file(ctx.configuration.genfiles_dir,
                      '/'.join([ctx.label.name, filename]))


def _typescript_transpile(ctx, input_files, out_artifacts):
  # Transpile input_files to out_artifacts
  flags = [
      '--strictNullChecks',
      '-d',
      '-t ES5',
  ]

  if ctx.attr.mode == 'strict':
    flags += [
        '--noFallthroughCasesInSwitch',
        '--noImplicitAny',
        '--noImplicitReturns',
        '--noImplicitThis',
        '--noUnusedLocals',
        '--noUnusedParameters',
    ]
  if ctx.attr.mode != 'dev':
    flags.append('--removeComments')

  output_list = [out_artifacts.compiled, out_artifacts.typedecl]
  if out_artifacts.srcmap:
    flags.append('--sourceMap')
    output_list.append(out_artifacts.srcmap)

  flags += [
      '--out',
      out_artifacts.compiled.path,
  ]

  paths = cmd_helper.join_paths(' ', set(input_files))
  ctx.action(
      inputs=input_files,
      outputs=output_list,
      command='tsc %s %s' % (' '.join(flags), paths),
      progress_message=('Transpiling TypeScript %s' %
                        out_artifacts.compiled.path),
  )


def _uglify(ctx, in_artifacts, out_artifacts):
  flags = [
      '-c',
      '-m',
      '--keep-fnames',
      '-q 0',
  ]
  if hasattr(in_artifacts, 'compiled'):
    if type(in_artifacts.compiled) == 'list':
      inputs = in_artifacts.compiled
    else:
      inputs = [in_artifacts.compiled]
  else:
    inputs = in_artifacts
  outputs = [out_artifacts.compiled]
  if out_artifacts.srcmap:
    if hasattr(in_artifacts, 'srcmap') and in_artifacts.srcmap:
      flags += ['--in-source-map', in_artifacts.srcmap.path]
      inputs.append(in_artifacts.srcmap)

    #if ctx.attr.source_root:
    #  flags += ['--source-map-root', ctx.file.source_map.path]
    flags += ['--source-map', '%s' % out_artifacts.srcmap.path]
    outputs.append(out_artifacts.srcmap)

  flags += ['-o', '%s' % out_artifacts.compiled.path]

  ctx.action(
      inputs=inputs,
      outputs=outputs,
      command='uglifyjs %s %s' % (' '.join(flags),
                                  cmd_helper.join_paths(' ', set(inputs))),
      progress_message=('Uglifying %s' % out_artifacts.compiled.path),
  )


def _generate_userscript_block(id=None, title=None, category=None,
                               version=None, base_url=None, rootname=None,
                               description=None, include=None, grant=None):
  meta_lines = [
    '// ==UserScript==',
  ]

  if id:
    meta_lines.append('// @id           %s' % id)
  if title:
    meta_lines.append('// @name         %s' % title)
  if category:
    meta_lines.append('// @category     %s' % category)
  if version:
    meta_lines.append('// @version      %s' % (version +
                                               '.@@DATETIMEVERSION@@'))
  meta_lines.append('// @namespace    https://iitc.me')
  if base_url and rootname:
    base_url = base_url.rstrip('/')
    meta_lines.append('// @updateURL    %s/%s.meta.js' % (base_url, rootname))
    meta_lines.append('// @downloadURL  %s/%s.user.js' % (base_url, rootname))
  if description:
    description = '[iitc-@@BUILDDATE@@] ' + description.replace('\n', ' ')
    meta_lines.append('// @description  %s' % description)

  for i in include:
    meta_lines.append('// @include      %s' % i)
  for i in include:
    meta_lines.append('// @match        %s' % i)
  for g in grant:
    meta_lines.append('// @grant        %s' % g)

  meta_lines += [
    '// ==/UserScript==',
    '',
  ]

  return '\n'.join(meta_lines)


def _add_wrapper(ctx, wrapper_file, in_artifacts, out_artifacts,
                 extra_replacements=None):
  wrapper_pre = _intermediate_file(ctx, "wrapper_pre.js")
  wrapper_post = _intermediate_file(ctx, "wrapper_post.js")

  ctx.action(
      inputs=[wrapper_file],
      outputs=[wrapper_pre],
      command=('sed -ne "1,/^\'@@WRAPPED_CODE@@\';\$/'
               + '{ /^\'@@WRAPPED_CODE@@\';\$/d; p; }" %s > %s' % (
                   wrapper_file.path,
                   wrapper_pre.path,
                   )),
      progress_message=('Preparing wrapper for %s' %
                        out_artifacts.compiled.path),
  )

  ctx.action(
      inputs=[wrapper_file],
      outputs=[wrapper_post],
      command=('sed -ne "/^\'@@WRAPPED_CODE@@\';\$/,\$'
               + '{ s/^\'@@WRAPPED_CODE@@\';\$//; p; }" %s > %s' % (
                   wrapper_file.path,
                   wrapper_post.path,
                   )),
      progress_message=('Preparing wrapper for %s' %
                        out_artifacts.compiled.path),
  )

  if extra_replacements:
    plugin_deps = extra_replacements.get('@@PLUGIN_DEPS@@', '')
  else:
    plugin_deps = ''

  if hasattr(in_artifacts, 'compiled'):
    input = in_artifacts.compiled
  else:
    input = in_artifacts
  ctx.action(
      inputs=[wrapper_pre, input, wrapper_post],
      outputs=[out_artifacts.compiled],
      command='cat %s %s %s | sed -re "s/@@PLUGIN_DEPS@@/%s/" > %s' % (
          wrapper_pre.path, input.path, wrapper_post.path,
          plugin_deps, out_artifacts.compiled.path),
      progress_message=('Preparing wrapper for %s' %
                        out_artifacts.compiled.path),
  )


def _add_userscript(ctx, in_artifacts, out_artifacts, metadata=None):
  include = [
      'https://*.ingress.com/intel*',
      'http://*.ingress.com/intel*',
      'https://*.ingress.com/mission*',
      'http://*.ingress.com/mission*',
  ]

  if not metadata:
    metadata = {
        'id': ctx.attr.id,
        'title': ctx.attr.title,
        'version': ctx.attr.version,
        'base_url': ctx.attr.base_url,
        'description': ctx.attr.description,
        'category': (ctx.attr.category if hasattr(ctx.attr, 'category')
                     else None),
    }

  if 'rootname' not in metadata:
    metadata['rootname'] = ctx.label.name

  meta_block = _generate_userscript_block(
      include=include,
      grant=['none'],
      **metadata
  )

  ctx.file_action(
      output=out_artifacts.metajs,
      content=meta_block,
  )

  ctx.action(
      inputs=[in_artifacts.compiled, out_artifacts.metajs],
      outputs=[out_artifacts.userjs],
      command='cat %s <(echo) %s > %s' % (out_artifacts.metajs.path,
                                          in_artifacts.compiled.path,
                                          out_artifacts.userjs.path),
      progress_message=('Adding userscript header to %s' %
                        out_artifacts.userjs.path),
  )


def _run_iitc_processor(ctx, in_artifacts, out_artifacts, include=None,
                        exclude=None, assets=None):
  args = [
      '--infile', in_artifacts.compiled.path,
      '--outfile', out_artifacts.compiled.path,
  ]
  if include:
    for f in include:
      args += ['--include', f]
  if exclude:
    for f in exclude:
      args += ['--exclude', f]
  if assets:
    for f in assets:
      args += ['--asset', f.path]

  ctx.action(
      inputs=[in_artifacts.compiled] + (assets if assets else []),
      outputs=[out_artifacts.compiled],
      executable=ctx.executable._processor,
      arguments=args,
      progress_message='Processing %s' % out_artifacts.compiled.path,
  )


def _combine_files(ctx, in_files, outfile):
  ctx.action(
      inputs=in_files,
      outputs=[outfile],
      command='cat %s > %s' % (cmd_helper.join_paths(' ', set(in_files)),
                               outfile.path),
      progress_message=('Combining source files to %s' % outfile.path),
  )


def _get_transitive_files(ctx):
  s = set()
  if hasattr(ctx.attr, 'deps'):
    for dep in ctx.attr.deps:
      if hasattr(dep, 'transitive_files'):
        s += dep.transitive_files
      else:
        s += dep.files
  if hasattr(ctx.files, 'srcs'):
    s += ctx.files.srcs
  return s


########################################################################
# IITC source processor
########################################################################

def _iitc_process_impl(ctx):
  pass

iitc_process = rule(
    implementation = _iitc_process_impl,
    attrs = {
        'deps': attr.label_list(allow_files=userscript_filetype),
        'srcs': attr.label_list(allow_files=userscript_filetype),

        'replace': attr.string_list(),
        'exclude': attr.string_list(),

        '_processor': attr.label(
            default=Label('//tools:iitc_processor'),
            allow_single_file=True,
            executable=True,
        ),
    },
    outputs = {
        'out': '%{name}.user.js',
        'meta_out': '%{name}.meta.js',
    },
)


POSTPROCESS_STEPS = [
    'BUILDDATE',
    'DATETIMEVERSION',
]

def iitc_preprocess(name, srcs=[], deps=[]):
  iitc_process(
      name=name,
      srcs=srcs,
      deps=deps,
      exclude=POSTPROCESS_STEPS,
  )

def iitc_postprocess(name, srcs=[], deps=[]):
  iitc_process(
      name=name,
      srcs=srcs,
      deps=deps,
      include=POSTPROCESS_STEPS,
  )


########################################################################
# Plugin builder
########################################################################
def _iitc_plugin(ctx, inputs, out_userjs, out_metajs, srcmap=None):
  # Step 1: add plugin wrapper
  # --------------------------
  wrapped_artifacts = struct(
      compiled=_intermediate_file(ctx, "wrapped.js"),
      srcmap=inputs.srcmap if hasattr(inputs, 'srcmap') else None,
  )
  _add_wrapper(ctx, ctx.file.wrapper, inputs, wrapped_artifacts,
               extra_replacements={
                   '@@PLUGIN_DEPS@@': ','.join(ctx.attr.plugin_deps),
               })

  # Step 2: Preprocess
  # ------------------
  preprocessed_artifacts = struct(
      compiled=_intermediate_file(ctx, "preprocessed.js"),
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, wrapped_artifacts, preprocessed_artifacts,
                      exclude=POSTPROCESS_STEPS, assets=ctx.files.assets)

  # Step 3: Uglify
  # --------------
  if ctx.attr.mode == 'dev':
    # Skip in dev mode
    uglify_artifacts = struct(
        compiled=preprocessed_artifacts.compiled,
        srcmap=preprocessed_artifacts.srcmap,
    )
  else:
    uglify_artifacts = struct(
        compiled=_intermediate_file(ctx, "uglified.js"),
        srcmap=None,
    )
    _uglify(ctx, preprocessed_artifacts, uglify_artifacts)

  # Step 4: userscript block
  # ------------------------
  userscript_artifacts = struct(
      userjs=_intermediate_file(ctx, "userscript.user.js"),
      metajs=_intermediate_file(ctx, "userscript.meta.js"),
  )
  metadata = ctx.attr.metadata + {'base_url': ctx.attr.base_url}
  _add_userscript(ctx, uglify_artifacts, userscript_artifacts,
                  metadata=metadata)

  # Step 5: Postprocess
  # -------------------
  postprocessed_userjs_artifacts = struct(
      compiled=out_userjs,
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, struct(compiled=userscript_artifacts.userjs),
                      postprocessed_userjs_artifacts, include=POSTPROCESS_STEPS,
                      assets=ctx.files.assets)

  postprocessed_metajs_artifacts = struct(
      compiled=out_metajs,
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, struct(compiled=userscript_artifacts.metajs),
                      postprocessed_metajs_artifacts, include=POSTPROCESS_STEPS,
                      assets=ctx.files.assets)


def _iitc_js_plugin_impl(ctx):
  all_files = list(_get_transitive_files(ctx))

  out_userjs = ctx.outputs.userjs
  out_metajs = ctx.outputs.metajs

  combined = _intermediate_file(ctx, "combined.js")

  _combine_files(ctx, all_files, combined)

  _iitc_plugin(ctx, combined, out_userjs, out_metajs)


def _iitc_ts_plugin_impl(ctx):
  all_files = list(_get_transitive_files(ctx))

  out_userjs = ctx.outputs.userjs
  out_metajs = ctx.outputs.metajs
  out_typedecl = ctx.outputs.typedecl

  # Step 1: Transpile
  # -----------------
  ts_artifacts = struct(
      compiled=_intermediate_file(ctx, "compiled.js"),
      typedecl=_intermediate_file(ctx, "compiled.d.ts"),
      srcmap=None,
  )

  ts_files = ts_filetype.filter(all_files)
  _typescript_transpile(ctx, ts_files, ts_artifacts)

  # Step 2: Do the rest of the plugin stuff
  # ---------------------------------------
  _iitc_plugin(ctx, ts_artifacts.compiled, out_userjs, out_metajs)

  # Step 3: Fix outputs
  # -------------------
  ctx.action(
      inputs=[ts_artifacts.typedecl],
      outputs=[out_typedecl],
      command='cp %s %s' % (ts_artifacts.typedecl.path, out_typedecl.path),
      progress_message='Preparing typedecl %s' % out_typedecl.path,
  )


iitc_js_plugin = rule(
    implementation = _iitc_js_plugin_impl,
    attrs = {
        'srcs': attr.label_list(allow_files=js_filetype),
        'deps': attr.label_list(allow_files=False),
        'assets': attr.label_list(allow_files=True),
        'metadata': attr.string_dict(mandatory=True),
        'base_url': attr.string(default=DOWNLOAD_URLS['release']),
        'plugin_deps': attr.string_list(),
        'mode': attr.string(values=['loose', 'strict', 'dev'], default='loose'),
        'wrapper': attr.label(
            default=Label('//tools:plugin_wrapper.js'),
            allow_single_file=True,
            executable=False,
        ),

        '_processor': attr.label(
            default=Label('//tools:iitc_processor'),
            executable=True,
        ),
    },
    outputs = {
        'userjs': '%{name}.user.js',
        'metajs': '%{name}.meta.js',
    },
)

iitc_ts_plugin = rule(
    implementation = _iitc_ts_plugin_impl,
    attrs = {
        'srcs': attr.label_list(allow_files=ts_filetype),
        'deps': attr.label_list(allow_files=False),
        'assets': attr.label_list(allow_files=True),
        'metadata': attr.string_dict(mandatory=True),
        'base_url': attr.string(default=DOWNLOAD_URLS['release']),
        'plugin_deps': attr.string_list(),
        'mode': attr.string(values=['loose', 'strict', 'dev'], default='loose'),
        'wrapper': attr.label(
            default=Label('//tools:plugin_wrapper.js'),
            allow_single_file=True,
            executable=False,
        ),

        '_processor': attr.label(
            default=Label('//tools:iitc_processor'),
            executable=True,
        ),
    },
    outputs = {
        'userjs': '%{name}.user.js',
        'metajs': '%{name}.meta.js',
        'typedecl': '%{name}.d.ts',
    },
)


########################################################################
# Main IITC binary builder
########################################################################
def _iitc_binary_impl(ctx):
  all_files = list(_get_transitive_files(ctx))

  out_userjs = ctx.outputs.userjs
  out_metajs = ctx.outputs.metajs
  out_typedecl = ctx.outputs.typedecl
  if ctx.attr.generate_source_map:
    out_srcmap = ctx.outputs.srcmap

  # Step 1: Transpile
  # -----------------
  ts_artifacts = struct(
      compiled=_intermediate_file(ctx, "compiled.js"),
      typedecl=_intermediate_file(ctx, "compiled.d.ts"),
      srcmap=(_intermediate_file(ctx, "compiled.js.map")
              if ctx.attr.generate_source_map else None),
  )

  ts_files = ts_filetype.filter(all_files)
  _typescript_transpile(ctx, ts_files, ts_artifacts)

  # Step 2: combine dependencies
  # ----------------------------
  combined_artifacts = struct(
      inputs=list(js_filetype.filter(all_files)) + [ts_artifacts.compiled],
      compiled=_intermediate_file(ctx, "combined.js"),
      srcmap=ts_artifacts.srcmap,
  )
  _combine_files(ctx, combined_artifacts.inputs, combined_artifacts.compiled)

  # Step 3: add inject wrapper
  # --------------------------
  wrapped_artifacts = struct(
      compiled=_intermediate_file(ctx, "wrapped.js"),
      srcmap=ts_artifacts.srcmap,
  )
  _add_wrapper(ctx, ctx.file.wrapper, combined_artifacts, wrapped_artifacts)

  # Step 4: Preprocess
  # ------------------
  preprocessed_artifacts = struct(
      compiled=_intermediate_file(ctx, "preprocessed.js"),
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, wrapped_artifacts, preprocessed_artifacts,
                      exclude=POSTPROCESS_STEPS, assets=ctx.files.assets)

  # Step 5: Uglify
  # --------------
  if ctx.attr.mode == 'dev':
    # No uglification in dev mode, but still need to combine scripts
    uglify_artifacts = struct(
        compiled=preprocessed_artifacts.compiled,
        srcmap=preprocessed_artifacts.srcmap,
    )
  else:
    uglify_artifacts = struct(
        compiled=_intermediate_file(ctx, "uglified.js"),
        srcmap=(_intermediate_file(ctx, "uglified.js.map")
                if ctx.attr.generate_source_map else None),
    )
    _uglify(ctx, preprocessed_artifacts, uglify_artifacts)

  # Step 6: userscript block
  # ------------------------
  userscript_artifacts = struct(
      userjs=_intermediate_file(ctx, "userscript.user.js"),
      metajs=_intermediate_file(ctx, "userscript.meta.js"),
  )
  _add_userscript(ctx, uglify_artifacts, userscript_artifacts)

  # Step 7: Postprocess
  # -------------------
  postprocessed_userjs_artifacts = struct(
      compiled=out_userjs,
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, struct(compiled=userscript_artifacts.userjs),
                      postprocessed_userjs_artifacts, include=POSTPROCESS_STEPS,
                      assets=ctx.files.assets)

  postprocessed_metajs_artifacts = struct(
      compiled=out_metajs,
      srcmap=wrapped_artifacts.srcmap,
  )
  _run_iitc_processor(ctx, struct(compiled=userscript_artifacts.metajs),
                      postprocessed_metajs_artifacts, include=POSTPROCESS_STEPS,
                      assets=ctx.files.assets)

  # Step 8: fix outputs
  # -------------------
  ctx.action(
      inputs=[ts_artifacts.typedecl],
      outputs=[out_typedecl],
      command='cp %s %s' % (ts_artifacts.typedecl.path, out_typedecl.path),
      progress_message='Preparing typedecl %s' % out_typedecl.path,
  )

  if ctx.attr.generate_source_map:
    ctx.action(
        inputs=[uglify_artifacts.srcmap],
        outputs=[out_srcmap],
        command='[[ -e %s ]] && cp %s %s || touch %s' % (
            uglify_artifacts.srcmap.path, uglify_artifacts.srcmap.path,
            out_srcmap.path, out_srcmap.path),
        progress_message='Preparing source map %s' % out_srcmap.path,
    )


def _iitc_binary_outputs(generate_source_map):
  outputs = {
      'userjs': '%{name}.user.js',
      'metajs': '%{name}.meta.js',
      'typedecl': '%{name}.d.ts',
  }
  if generate_source_map:
    outputs['srcmap'] = '%{name}.js.map'
  return outputs


iitc_binary = rule(
    implementation = _iitc_binary_impl,
    attrs = {
        'deps': attr.label_list(allow_files=False),
        'assets': attr.label_list(allow_files=True),
        'id': attr.string(default='ingress-intel-total-conversion@iitc-me'),
        'title': attr.string(default='IITC: Ingress intel map total conversion'),
        'version': attr.string(mandatory=True),
        'description': attr.string(default='Total conversion for the Ingress intel map.'),
        'base_url': attr.string(default=DOWNLOAD_URLS['release']),
        'generate_source_map': attr.bool(),
        'mode': attr.string(values=['loose', 'strict', 'dev'], default='loose'),
        'wrapper': attr.label(
            default=Label('//tools:core_wrapper.js'),
            allow_single_file=True,
            executable=False,
        ),

        '_processor': attr.label(
            default=Label('//tools:iitc_processor'),
            executable=True,
        ),
    },
    outputs = _iitc_binary_outputs,
)


########################################################################
# Development helpers
########################################################################

def iitc_repl(name, src):
  """Create a script that can be used to run a nodejs REPL with the src loaded,
  for debugging purposes.

  Args:
    name: (string) The rule name.
    src: (string) The source JavaScript file to load.

  Outputs:
    %{name}.sh: The script which starts the REPL.
  """
  native.genrule(
      name=name,
      srcs=[src],
      outs=[name + '.sh'],
      cmd='echo "#!/bin/bash\nnode -e \\"var fs=require(\'fs\');eval(fs.readFileSync(\'$<\')+\'\');\\" -i" > $@',
      executable=1,
      output_to_bindir=1,
  )
