import { defineConfig } from 'vite';
import customServerPlugin from './vite-plugin-vwi.js';
import fs from 'fs'

export default defineConfig({
  plugins: [customServerPlugin()],
  server: {
    https: {
      key: fs.readFileSync('https/key.pem'),
      cert: fs.readFileSync('https/cert.pem'),
    }
  }
});
