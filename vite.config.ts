import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';
  const hmrPort = Number(process.env.HMR_PORT) || 24678;
  return {
    plugins: [react(), tailwindcss()],
    // Keep Vite's generated dependency cache outside node_modules. The latter
    // can be locked by a previous Windows process, preventing the source tool
    // from starting even though the project itself is healthy.
    cacheDir: path.resolve(configDir, '.vite-runtime-cache'),
    resolve: {
      alias: {
        '@': path.resolve(configDir, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      // Each simultaneously running source tool can use its own HMR port.
      // Disabling HMR while the React refresh transform is active leaves
      // $RefreshSig$ undefined and produces a completely white page.
      hmr: hmrEnabled ? { port: hmrPort, clientPort: hmrPort } : false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/.env', '**/backup_*/**']
      },
    },
    build: {
      // VidiFlow is served from the customer's local desktop, not transferred
      // over a public web connection. After splitting reusable vendors, keep
      // the warning threshold aligned with the remaining single App module.
      chunkSizeWarningLimit: 1200,
      // Stable vendor chunks reduce the amount customers download again after
      // an app-only update and let the browser parse large libraries in
      // parallel with VidiFlow's own UI code.
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "ui-vendor": ["lucide-react", "motion"],
          },
        },
      },
    },
  };
});
