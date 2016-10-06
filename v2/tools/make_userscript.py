#!/usr/bin/python
import argparse
import io
import os
import re


class UserScripter(object):

  def __init__(self, wrapper, id, name, category, version, base_url,
      description, includes, grants, replacements):

    self.wrapper = wrapper
    self.id = id
    self.name = name
    self.category = category
    self.version = version
    self.base_url = base_url
    self.description = description
    self.includes = includes or []
    self.grants = grants or ['none']
    self.replacements = replacements or {}

  def get_meta_block(self, filename):
    meta_lines = [
      '// ==UserScript==',
    ]

    if self.id:
      meta_lines.append('// @id           %s' % self.id)
    if self.name:
      meta_lines.append('// @name         %s' % self.name)
    if self.category:
      meta_lines.append('// @category     %s' % self.category)
    if self.version:
      meta_lines.append('// @version      %s' % self.version)
    meta_lines.append('// @namespace    https://iitc.me')
    if self.base_url and filename:
      base_url = self.base_url.rstrip('/')
      meta_lines.append('// @updateURL    %s/%s.meta.js' % (base_url, filename))
      meta_lines.append('// @downloadURL  %s/%s.user.js' % (base_url, filename))
    if self.description:
      meta_lines.append('// @description  %s'
          % self.description.replace('\n', ' '))

    for i in self.includes:
      meta_lines.append('// @include      %s' % i)
    for i in self.includes:
      meta_lines.append('// @match        %s' % i)
    for g in self.grants:
      meta_lines.append('// @grant        %s' % g)

    meta_lines += [
      '// ==/UserScript==',
      '',
    ]

    return '\n'.join(meta_lines)

  def get_userscript(self, filename, script_content):
    result = self.get_meta_block(filename) + '\n'
    result += re.sub(r"^'@@WRAPPED_CODE@@';$", script_content, self.wrapper,
        flags=re.MULTILINE)

    for k, v in self.replacements.items():
      result = result.replace('@@%s@@' % k, v)
    return result


def main():
  parser = argparse.ArgumentParser()

  parser.add_argument('--infile', required=True, help='Input file')
  parser.add_argument('--wrapper', required=True, help='Wrapper file')
  parser.add_argument('--outfile', required=True, help='Output userjs file')
  parser.add_argument('--outmeta', required=True, help='Output metajs file')

  parser.add_argument('--replace', metavar='KEYWORD=REPLACEMENT',
      action='append', help='List of additional replacements to make')

  parser.add_argument('--id', metavar='ID', help='Script ID')
  parser.add_argument('--name', metavar='NAME', required=True,
      help='Script name')
  parser.add_argument('--category', metavar='CATEGORY', help='Plugin category')
  parser.add_argument('--version', metavar='VERSION', required=True,
      help='Plugin version')

  parser.add_argument('--base-url', metavar='URL', help='Base download URL')
  parser.add_argument('--description', metavar='DESCRIPTION',
      help='Plugin description')

  parser.add_argument('--include', metavar='URL', action='append',
      help='URL(s) to embed the script on')
  parser.add_argument('--grant', metavar='PERMISSION', action='append',
      help='Permission(s) to grant')

  FLAGS = parser.parse_args()

  with io.open(FLAGS.wrapper, 'Ur', encoding='utf-8') as fp:
    wrapper = fp.read()

  if FLAGS.replace:
    replacements = dict(r.split('=', 1) for r in FLAGS.replace)
  else:
    replacements = {}

  transformer = UserScripter(wrapper=wrapper, id=FLAGS.id, name=FLAGS.name,
      category=FLAGS.category, version=FLAGS.version, base_url=FLAGS.base_url,
      description=FLAGS.description, includes=FLAGS.include, grants=FLAGS.grant,
      replacements=replacements)

  filename = os.path.basename(FLAGS.outfile).replace('.user.js', '')
  with io.open(FLAGS.infile, 'Ur', encoding='utf-8') as fp:
    contents = fp.read()

  metajs = transformer.get_meta_block(filename)
  userjs = transformer.get_userscript(filename, contents)

  with io.open(FLAGS.outfile, 'w', encoding='utf-8') as fp:
    fp.write(userjs)
  with io.open(FLAGS.outmeta, 'w', encoding='utf-8') as fp:
    fp.write(metajs)


if __name__ == '__main__':
  main()
