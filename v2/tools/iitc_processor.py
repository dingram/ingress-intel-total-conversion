import argparse
import re
import time


ALL_KEYWORDS = [
    'INCLUDERAW',
    'INCLUDESTRING',
    'INCLUDEMD',
    'INCLUDEIMAGE',

    'BUILDDATE',
    'DATETIMEVERSION',

    'RESOURCEURLBASE',
    'BUILDNAME',
    'UPDATEURL',
    'DOWNLOADURL',
    'PLUGINNAME',
]


parser = argparse.ArgumentParser()

parser.add_argument('--infile', required=True, type=argparse.FileType('rb'),
    help='Input file')
parser.add_argument('--outfile', required=True, type=argparse.FileType('wb'),
    help='Output file')
parser.add_argument('--include', metavar='KEYWORD,...',
    help='Whitelist of keywords to process')
parser.add_argument('--exclude', metavar='KEYWORD,...',
    help='Blacklist of keywords to not process')


FLAGS = parser.parse_args()


if FLAGS.include and FLAGS.exclude:
  raise ValueError('Cannot have both --include and --exclude')

if FLAGS.include:
  keywords_to_process = sorted(set(FLAGS.include.split(',')))
if FLAGS.exclude:
  keywords_to_process = sorted(set(ALL_KEYWORDS) - set(FLAGS.exclude.split(',')))

contents = FLAGS.infile.read()

utcNow = time.gmtime()
for keyword in keywords_to_process:
  if keyword == 'BUILDDATE':
    buildDate = time.strftime('%Y-%m-%d-%H%M%S', utcNow)
    contents = contents.replace(b'@@BUILDDATE@@', buildDate.encode('utf-8'))
  elif keyword == 'DATETIMEVERSION':
    # userscript version codes must be fully numeric
    dateTimeVersion = time.strftime('%Y%m%d.%H%M%S', utcNow).lstrip('0')
    contents = contents.replace(b'@@DATETIMEVERSION@@', dateTimeVersion.encode('utf-8'))

FLAGS.outfile.write(contents)

FLAGS.infile.close()
FLAGS.outfile.close()
