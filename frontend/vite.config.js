import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    // semantic-ui-css incluye selectores no estándar que lightningcss rechaza al minificar.
    lightningcss: { errorRecovery: true },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
