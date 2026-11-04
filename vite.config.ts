import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {readFileSync, rmSync, writeFileSync} from 'fs';
import {createHash} from 'crypto';
import {viteSingleFile} from 'vite-plugin-singlefile';
import type {Plugin} from 'vite';
import {defineConfig} from 'vitest/config';

// package.json is the single source of truth for the app version.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

/**
 * Extra settings for `vite build --mode singlefile`, which makes RatDoku.html (repository root):
 * the whole game (code, styles, puzzle generator, favicon) inside one HTML file that
 * can be saved and opened offline. Runs after the normal build as part of `npm run build`.
 */
function standaloneHtml(): Plugin {
  const favicon = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf-8');
  return {
    name: 'ratdoku-standalone-html',
    transformIndexHtml(html) {
      return html
        // Embed the favicon; drop the app-install links, which need the full website.
        .replace(
          /<link rel="icon"[^>]*>/,
          `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}" />`,
        )
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '')
        .replace(/\s*<link rel="manifest"[^>]*>/, '');
    },
    closeBundle() {
      // Refresh the copy kept in the repository root (RatDoku.html). It is committed with
      // every change so it can be downloaded straight from GitHub; it is not part of the website.
      // Keep only the modern .woff2 copy of each embedded font (every current browser uses it).
      const html = readFileSync('dist-single/index.html', 'utf-8').replace(
        /,\s*url\(data:font\/woff;base64,[^)]*\)\s*format\("woff"\)/g,
        '',
      );
      writeFileSync('RatDoku.html', html);
      rmSync('dist-single', {recursive: true, force: true});
    },
  };
}

/**
 * Website build only: writes this build's file list into dist/sw.js, so the service worker
 * downloads the whole game on the first visit and can run offline from then on. The cache
 * name changes whenever any file changes, which also makes browsers pick up the new version.
 */
function precacheList(): Plugin {
  let files: string[] = [];
  return {
    name: 'ratdoku-precache-list',
    apply: 'build',
    generateBundle(_options, bundle) {
      // .woff fonts are only a fallback for very old browsers; current ones use .woff2.
      files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && !f.endsWith('.woff'))
        .sort();
    },
    closeBundle() {
      const swPath = 'dist/sw.js';
      const placeholder = "/*__RATDOKU_BUILD__*/ { cache: 'ratdoku-dev', files: [] }";
      const sw = readFileSync(swPath, 'utf-8');
      if (!sw.includes(placeholder)) throw new Error('sw.js build placeholder not found');
      const hash = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 10);
      const build = {cache: `ratdoku-${pkg.version}-${hash}`, files};
      writeFileSync(swPath, sw.replace(placeholder, JSON.stringify(build)));
    },
  };
}

export default defineConfig(({mode}) => {
  const single = mode === 'singlefile';
  return {
    ...(single && {
      publicDir: false as const,
      build: {outDir: 'dist-single', emptyOutDir: true},
    }),
    // Relative base so the same build works at the site root (Docker)
    // and under a sub-path such as /RatDoku/ (GitHub Pages).
    base: './',
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), standaloneHtml()] : [precacheList()])],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    worker: {
      format: 'es' as const,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        ...(single && {
          // Embed the puzzle generator in the page instead of loading it from a separate file.
          './createPuzzleWorker': path.resolve(__dirname, 'src/utils/createPuzzleWorker.single.ts'),
        }),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
