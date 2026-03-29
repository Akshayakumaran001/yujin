import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/contacts': 'http://localhost:3000',
      '/messages': 'http://localhost:3000',
      '/templates': 'http://localhost:3000',
      '/system': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/ai': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
    },
  },
})
