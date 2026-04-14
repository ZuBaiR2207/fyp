import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Some websocket libs (SockJS/STOMP) expect Node's `global`.
    global: 'globalThis'
  }
})
