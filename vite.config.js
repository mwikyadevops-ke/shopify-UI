import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Get API URL from environment variable
const API_URL = process.env.VITE_API_URL || 'https://shopifyapi.optusconnect.co.ke/api';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward cookies from browser to backend
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
        }
      }
    }
  }
});

// 

