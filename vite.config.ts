import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对路径：本地 dev、子路径部署（GitHub Pages 项目页 /weijue/）都能用
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  server: { port: 5188, strictPort: true },
});
