import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// JSON error handler for any /api errors or payload limits
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error in production server:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.type === 'entity.too.large'
      ? 'Uploaded images are too large. Please select smaller images.'
      : 'Unable to analyze the uploaded images. Please try again.',
  });
});

// API 404 handler - never return HTML for API routes
app.use('/api', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve static frontend files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// SPA Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Waste2Worth AI server listening on http://0.0.0.0:${PORT}`);
});
