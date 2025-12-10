const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/popup.js',
  format: 'iife',
  logLevel: 'info',
  plugins: [
    sassPlugin({
      type: 'css-text',
    }),
  ],
};

if (isWatch) {
  esbuild.context(buildOptions).then((ctx) => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
