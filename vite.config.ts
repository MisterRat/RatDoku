import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {copyFileSync, readFileSync, rmSync} from 'fs';
import {viteSingleFile} from 'vite-plugin-singlefile';
import type {Plugin} from 'vite';
import {defineConfig} from 'vitest/config';

// package.json is the single source of truth for the app version.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

/**
 * Extra settings for `vite build --mode singlefile`, which makes dist/RatDoku.html:
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
      // Move the result next to the website build as dist/RatDoku.html.
      copyFileSync('dist-single/index.html', 'dist/RatDoku.html');
      rmSync('dist-single', {recursive: true, force: true});
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
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), standaloneHtml()] : [])],
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
