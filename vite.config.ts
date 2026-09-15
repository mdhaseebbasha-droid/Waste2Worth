import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import express from 'express';
import {apiRouter} from './server/routes.ts';

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json({ limit: '50mb' }));
      app.use(express.urlencoded({ extended: true, limit: '50mb' }));
      app.use('/api', apiRouter);

      // JSON error handler for /api routes (catches body parsing and unhandled errors)
      app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('API middleware error in dev:', err);
        const status = err.status || err.statusCode || 500;
        res.status(status).json({
          error: err.type === 'entity.too.large'
            ? 'Uploaded images are too large. Please select smaller images.'
            : 'Unable to analyze the uploaded images. Please try again.',
        });
      });

      // Never allow unhandled /api requests to fall through to Vite SPA HTML
      app.use('/api', (req: express.Request, res: express.Response) => {
        res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
      });

      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
