import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { sanitize as mongoSanitize } from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ CORS must be FIRST — handles preflight automatically via app.use
app.use(cors(corsOptions));

// Security & body parsing middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// express-mongo-sanitize: only sanitize body & params — req.query is read-only in Express v5
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
});

// Apply global rate limiting
app.use('/api', globalLimiter);

// Routes
app.use('/api', routes);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
