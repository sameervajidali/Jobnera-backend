// server.js (or app.js)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path    from 'path';
import cors    from 'cors';
import morgan  from 'morgan';
import mongoose from 'mongoose';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport     from './config/passport.js';
import { protect }  from './middlewares/authMiddleware.js';

import authRoutes   from './routes/authRoutes.js';
import adminRoutes  from './routes/adminRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import upload       from './config/multer.js';    // ⬅️ your disk‐storage multer

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const app = express();

// ─── Static uploads first ──────────────────────────────────────────
// Must be before your 404 handler so /uploads/* is served directly:
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// ─── Middleware ────────────────────────────────────────────────────
app.use(cookieParser());
app.use(cors({
  origin: ['https://www.jobneura.tech','https://jobneura.tech','http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain:  process.env.NODE_ENV === 'production' ? '.jobneura.tech' : 'localhost',
    path:    '/',
    httpOnly:true,
    secure:  process.env.NODE_ENV === 'production',
    sameSite:process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge:  7*24*60*60*1000,
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Healthcheck ───────────────────────────────────────────────────
app.get('/api/test', (_req, res) => {
  res.json({ success:true, message:'API is up!', time:new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/resumes', protect, resumeRoutes);
app.use('/api/public', publicRoutes);

// ─── 404 & Error Handler ───────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});
app.use((err, _req, res, _next) => {
  console.error('🔥 Error:', err.stack);
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message });
});

// ─── Mongo & Server Start ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(() => {
    console.log('📦 MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Mongo error:', err.message);
    process.exit(1);
  });
