import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Alerta se um chunk passar de 500KB
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Divide vendors em chunks separados para melhor cache do browser
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor':       ['lucide-react'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          'ai-vendor':       ['@google/generative-ai'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },

    // Minificação agressiva
    minify: 'esbuild',

    // Remove console.log em produção
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
  },

  // Pré-bundling otimizado
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@supabase/supabase-js',
      '@google/generative-ai',
    ],
  },
})
