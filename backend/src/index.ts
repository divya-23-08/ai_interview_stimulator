import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interview';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Build allowed origins list from env (comma-separated) + always allow localhost
const rawOrigins = process.env.ALLOWED_ORIGIN || '';
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  ...rawOrigins.split(',').map((o) => o.trim()).filter(Boolean),
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/interview', interviewRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
