/**
 * @fileoverview Express application configuration with security headers and middleware.
 */
import './config.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import apiRouter from './routes/api.js';

const app = express();

// --- Express Security Hardening (Security Parameter) ---
// Helmet configures secure HTTP response headers
app.use(helmet());

// Enable CORS for frontend client access
app.use(cors({
  origin: '*', // In production, replace with specific domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing incoming requests payload
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routing ---
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Express Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

export default app;
