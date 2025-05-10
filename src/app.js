
// backend/src/app.js  (only one copy of this file, not in src/src!)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path    from 'path';
import { fileURLToPath } from 'url';
import cors    from 'cors';
import morgan  from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport     from './config/passport.js';
import authRoutes   from './routes/authRoutes.js';
import adminRoutes  from './routes/adminRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { protect } from './middlewares/authMiddleware.js';
import quizRoutes from './routes/quizRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 1) Serve uploads
// in your app.js, after you define __dirname:
// app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//SDJFLSDSD FSDF 
// 2) Base middleware
app.use(cookieParser());
app.use(cors({
  origin: ['https://jobneura.tech','https://www.jobneura.tech','http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    domain:   process.env.NODE_ENV==='production'?'.jobneura.tech':'localhost',
    httpOnly: true,
    secure:   process.env.NODE_ENV==='production',
    sameSite: process.env.NODE_ENV==='production'?'None':'Lax',
    maxAge:   7*24*60*60*1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// 3) Healthcheck + root
app.get('/api/test', (_req, res) =>
  res.json({ success:true, message:'API up!', time:new Date().toISOString() })
);
app.get('/', (_req, res) =>
  res.send('✅ API is running...')
);

// 4) API routes
app.use('/api/ticket', ticketRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/resumes', protect, resumeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/quizzes', quizRoutes);  // all quiz endpoints live under /api/quizzes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminStatsRoutes);
// 5) 404 & error handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const code = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(code).json({ message: err.message });
});

export default app;


