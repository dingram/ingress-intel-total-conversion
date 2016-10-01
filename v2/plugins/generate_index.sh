#!/bin/bash

target_url=$1
shift

echo '<html>'
echo '<head>'
echo '<title>IITCv2 :: EXPERIMENTAL</title>'
echo '</head>'
echo '<body>'

echo '<h1>IITCv2 experimental</h1>'

echo '<h2>Core</h2>'
echo '<p><a href="iitc-exp.user.js">iitc-exp.user.js</a></p>'

echo '<h2>Plugins</h2>'
echo '<ul>'
for f in "$@"; do
  if [[ "$f" == *.d.ts || "$f" == *.meta.js ]]; then
    continue;
  fi
  n=$( basename "$f" )
  echo "<li><a href=\"$n\">$n</a></li>"
done
echo '</ul>'

echo '<h2>TypeScript type declarations:</h2>'
echo '<ul>'
echo '<li><a href="iitc-exp.d.ts">iitc-exp.d.ts</a></li>'
for f in "$@"; do
  if [[ "$f" != *.d.ts ]]; then
    continue;
  fi
  n=$( basename "$f" )
  echo "<li><a href=\"$n\">$n</a></li>"
done
echo '</ul>'

echo '</body>'
echo '</html>'
