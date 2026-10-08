import { defineConfig } from 'vite';
import { handleApiRequest } from './src/msds-api-controller.js';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  plugins: [
    {
      name: 'msds-agent-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/msds')) {
            const handled = await handleApiRequest(req, res);
            if (handled) return;
          }
          next();
        });
      },
    },
  ],
});
