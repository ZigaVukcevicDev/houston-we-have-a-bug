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

const editorOptions = {
  entryPoints: ['src/editor.ts'],
  bundle: true,
  outfile: 'dist/editor.js',
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
    esbuild.context(editorOptions),
    esbuild.context(backgroundOptions),
  ]).then(([popupCtx, editorCtx, bgCtx]) => {
    popupCtx.watch();
    editorCtx.watch();
    bgCtx.watch();
    console.log('Watching for changes...');
  });
} else {
  Promise.all([
    esbuild.build(popupOptions),
    esbuild.build(editorOptions),
    esbuild.build(backgroundOptions),
  ]).catch(() => process.exit(1));
}
