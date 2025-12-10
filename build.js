const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');

const isWatch = process.argv.includes('--watch');

const sharedPlugins = [
  sassPlugin({
    type: 'css-text',
  }),
];

const popupOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/popup.js',
  format: 'iife',
  logLevel: 'info',
  plugins: sharedPlugins,
};

const annotationOptions = {
  entryPoints: ['src/annotation.ts'],
  bundle: true,
  outfile: 'dist/annotation.js',
  format: 'iife',
  logLevel: 'info',
  plugins: sharedPlugins,
};

const backgroundOptions = {
  entryPoints: ['src/background.ts'],
  bundle: true,
  outfile: 'dist/background.js',
  format: 'iife',
  logLevel: 'info',
};

if (isWatch) {
  Promise.all([
    esbuild.context(popupOptions),
    esbuild.context(annotationOptions),
    esbuild.context(backgroundOptions),
  ]).then(([popupCtx, annotationCtx, bgCtx]) => {
    popupCtx.watch();
    annotationCtx.watch();
    bgCtx.watch();
    console.log('Watching for changes...');
  });
} else {
  Promise.all([
    esbuild.build(popupOptions),
    esbuild.build(annotationOptions),
    esbuild.build(backgroundOptions),
  ]).catch(() => process.exit(1));
}
