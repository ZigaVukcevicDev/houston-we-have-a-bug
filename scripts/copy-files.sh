#!/bin/sh
set -e
cp src/entrypoints/popup.html src/entrypoints/tab.html manifest.json dist/
cp -r src/images dist/
cp -r src/fonts dist/
mkdir -p dist/styles
cp src/styles/fonts.css dist/styles/fonts.css
