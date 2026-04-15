import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [tailwindcss(), react()],

    // ── Build output ─────────────────────────────────────────────────────────
    build: {
      outDir:    'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Vite 8 / rolldown requires manualChunks as a function
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('node_modules/recharts')) return 'charts';
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'ui';
          },
        },
      },
    },

    // ── Dev server ────────────────────────────────────────────────────────────
    server: {
      host: true, // expose on LAN for physical device testing
      port: 5173,
    },

    // ── Preview (after build) ─────────────────────────────────────────────────
    preview: {
      host: true,
      port: 4173,
    },
  };
});
