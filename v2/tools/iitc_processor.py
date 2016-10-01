import argparse

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

FLAGS.outfile.write(FLAGS.infile.read())
FLAGS.infile.close()
FLAGS.outfile.close()
