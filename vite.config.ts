import { defineConfig } from 'vite';
import { viteStaticCopy as copy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: '../node_modules/@shoelace-style/shoelace/dist/assets',
          dest: 'shoelace'
        }
      ]
    })
  ],
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
