#!/bin/sh
set -e
cp src/entrypoints/popup.html src/entrypoints/tab.html manifest.json test-page.html .chromeignore dist/
rsync -a --exclude='extension-presentation' src/images/ dist/images/
cp -r src/fonts dist/
mkdir -p dist/styles
cp src/styles/fonts.css dist/styles/fonts.css
