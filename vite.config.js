import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: "https://alexander-pag.github.io/frontend-voicebot",
  server: {
    proxy: {
      "/api": "https://eeb7-38-51-234-14.ngrok-free.app/",
    }  
  } ,
  plugins: [react()],
})
