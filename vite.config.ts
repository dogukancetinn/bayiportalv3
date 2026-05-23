import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://provanya.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/woocommerce/, '/wp-json/wc/v3'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // WooCommerce Basic Auth
            const key = process.env.WOOCOMMERCE_KEY || '';
            const secret = process.env.WOOCOMMERCE_SECRET || '';
            if (key && secret) {
              const auth = Buffer.from(`${key}:${secret}`).toString('base64');
              proxyReq.setHeader('Authorization', `Basic ${auth}`);
            }
          });
        },
      },
    },
  },
})
