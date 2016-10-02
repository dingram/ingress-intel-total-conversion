import argparse
import base64
import io
import os
import re
import time


class Transformer(object):

  ALL_KEYWORDS = [
      'BUILDDATE',
      'BUILDNAME',
      'DATETIMEVERSION',
      'DOWNLOADURL',
      'INCLUDEIMAGE',
      'INCLUDEMD',
      'INCLUDERAW',
      'INCLUDESTRING',
      'PLUGINNAME',
      'RESOURCEURLBASE',
      'UPDATEURL',
  ]
  PATH_ARG_REGEX = r'[0-9a-zA-Z_./-]+'

  def __init__(self, include=None, exclude=None, assets=None):
    self.utc_now = time.gmtime()

    if include and exclude:
      raise ValueError('Cannot have both --include and --exclude')

    if include:
      self.keywords = sorted(set(include))
    elif exclude:
      self.keywords = sorted(set(self.ALL_KEYWORDS) - set(exclude))

    self.assets = {}
    if assets:
      for a in assets:
        basename = os.path.basename(a)
        if basename in self.assets:
          raise ValueError('Repeated asset: %s conflicts with %s' % (
              a, self.assets[basename]))
        self.assets[basename] = a

  def asset_path(self, basename):
    if '/' in basename:
      raise ValueError('Slashes are not allowed in include: %s' % basename)
    if basename not in self.assets:
      raise ValueError('Unknown path: %s' % basename)
    return self.assets[basename]

  def read_file(self, basename):
    with io.open(self.asset_path(basename), 'rU', encoding='utf-8') as fp:
      return fp.read()

  def read_binary_file(self, basename):
    with io.open(self.asset_path(basename), 'rb') as fp:
      return fp.read()

  def transform(self, contents):
    for keyword in self.keywords:
      transformation = 'transform_%s' % keyword.lower()

      if keyword not in self.ALL_KEYWORDS:
        raise ValueError('Unknown keyword %s' % keyword)

      if not hasattr(self, transformation):
        continue

      transformed = getattr(self, transformation)(contents)
      if transformed is not None:
        contents = transformed

    return contents

  def transform_builddate(self, contents):
    build_date = time.strftime('%Y-%m-%d-%H%M%S', self.utc_now)
    return contents.replace('@@BUILDDATE@@', build_date)

  def transform_datetimeversion(self, contents):
    # userscript version codes must be fully numeric
    version = time.strftime('%Y%m%d.%H%M%S', self.utc_now).lstrip('0')
    return contents.replace('@@DATETIMEVERSION@@', version)

  def encode_image(self, basename, mime_type=None):
    if not mime_type:
      mime_type = 'image/png'
    b64 = base64.b64encode(self.read_binary_file(basename)).decode('utf-8')
    return 'data:{0};base64,{1}'.format(mime_type, b64.strip())

  def transform_includeimage(self, contents):
    contents = re.sub(
        r'@@INCLUDEIMAGE:(image/[a-z.-]+):(%s)@@' % (self.PATH_ARG_REGEX),
        lambda m: self.encode_image(m.group(2), m.group(1)),
        contents)
    contents = re.sub(
        r'@@INCLUDEIMAGE:(%s)@@' % self.PATH_ARG_REGEX,
        lambda m: self.encode_image(m.group(1)),
        contents)
    return contents

  def transform_includemd(self, contents):
    def err(x):
      raise NotImplementedError()
    return re.sub(
        r'@@INCLUDERAW:(%s)@@' % self.PATH_ARG_REGEX,
        err, # force an error if we ever find this tag
        contents)

  def transform_includeraw(self, contents):
    return re.sub(
        r'@@INCLUDERAW:(%s)@@' % self.PATH_ARG_REGEX,
        lambda x: self.read_file(x.group(1)),
        contents)

  def transform_includestring(self, contents):
    return re.sub(
        r'@@INCLUDESTRING:(%s)@@' % self.PATH_ARG_REGEX,
        lambda x: (self.read_file(x.group(1))
            .encode('unicode_escape')
            .decode('utf-8')
            .replace("'", "\\'")
            .replace('"', '\\"')),
        contents)


def main():
  parser = argparse.ArgumentParser()

  parser.add_argument('--infile', required=True, help='Input file')
  parser.add_argument('--outfile', required=True, help='Output file')
  parser.add_argument('--include', metavar='KEYWORD', action='append',
      choices=Transformer.ALL_KEYWORDS, help='Whitelist of keywords to process')
  parser.add_argument('--exclude', metavar='KEYWORD', action='append',
      choices=Transformer.ALL_KEYWORDS,
      help='Blacklist of keywords to not process')
  parser.add_argument('--asset', metavar='PATH', action='append',
      help='Path to asset to include in processing')

  FLAGS = parser.parse_args()
  transformer = Transformer(FLAGS.include, FLAGS.exclude, FLAGS.asset)

  with io.open(FLAGS.infile, 'Ur', encoding='utf-8') as fp:
    contents = fp.read()
  contents = transformer.transform(contents)
  with io.open(FLAGS.outfile, 'w', encoding='utf-8') as fp:
    fp.write(contents)

if __name__ == '__main__':
  main()
