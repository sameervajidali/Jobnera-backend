
// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// import authRoutes from './routes/authRoutes.js';
// import resumeRoutes from './routes/resumeRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// // instead of: import { protect } from './middlewares/auth.js';
// import { protect, requireRole } from './middlewares/authMiddleware.js';
// import User from './models/User.js';
// import cookieParser from 'cookie-parser';
// const app = express();
// app.use(cookieParser()); // 👈 Must be BEFORE route handlers

// import passport from './config/passport.js';
// import session from 'express-session';

// app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());
// ;


// // ============ MIDDLEWARE ============
// const allowedOrigins = ['http://localhost:5173'];
// app.use(cors({ origin: allowedOrigins, credentials: true }));
// app.use(express.json());
// app.use(morgan('dev'));

// // ============ ROUTES ============
// app.get('/', (_req, res) => res.send('API is running...'));

// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/resumes', protect, resumeRoutes);

// // ============ ERROR HANDLING ============
// app.use((_req, _res, next) => {
//   _res.status(404);
//   next(new Error(`Not Found - ${_req.originalUrl}`));
// });
// app.use((err, _req, res, _next) => {
//   const status = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(status).json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
//   });
// });

// // ============ SUPERADMIN SEED ============
// // server.js (or wherever you run seedSuperAdmin)


// async function seedSuperAdmin() {
//   const email = process.env.SUPERADMIN_EMAIL;
//   const password = process.env.SUPERADMIN_PASSWORD;
//   if (!email || !password) {
//     console.warn('⚠️ SUPERADMIN_EMAIL/PASSWORD not set—skipping superadmin seed.');
//     return;
//   }

//   // 1) Hash the plain‐text password from your .env
//   const hashed = await bcrypt.hash(password, 12);

//   // 2) Upsert the superadmin record so it always exists with the correct hash
//   const result = await User.updateOne(
//     { email },
//     {
//       // if inserting for the first time, set these fields
//       $setOnInsert: {
//         name: 'Super Admin',
//         provider: 'local',
//         isVerified: true,
//       },
//       // always overwrite the password & role to match your env
//       $set: {
//         password: hashed,
//         role: 'superadmin',
//       },
//     },
//     { upsert: true }
//   );

//   // 3) Log what happened
//   if (result.upsertedCount > 0) {
//     console.log(`🛡️ Created SUPERADMIN (${email})`);
//   } else {
//     console.log(`🔄 Updated SUPERADMIN (${email}) password to match .env`);
//   }
// }

// // ============ DATABASE & SERVER START ============
// const PORT = process.env.PORT || 5000;
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log('📦 MongoDB connected');
//     await seedSuperAdmin();
//     app.listen(PORT, () => {
//       console.log(`🚀 Server listening on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('❌ DB connection error:', err);
//     process.exit(1);
//   });

//   export default app;



// ========== ENVIRONMENT CONFIGURATION ==========
import dotenv from 'dotenv';
dotenv.config();

// ========== CORE IMPORTS ==========
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js'; // GitHub Strategy configured here
import User from './models/User.js';
import { protect, requireRole } from './middlewares/authMiddleware.js';

// ========== ROUTES ==========
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// ========== APP INITIALIZATION ==========
const app = express();

// ========== MIDDLEWARE: BASE ==========
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173'], // frontend origin
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// ========== MIDDLEWARE: SESSION & PASSPORT ==========
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ========== ROUTES ==========
app.get('/', (_req, res) => res.send('✅ API is running...'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resumes', protect, resumeRoutes); // 'protect' middleware for authentication

// ========== SUPERADMIN SEEDER ==========
async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️ SUPERADMIN_EMAIL/PASSWORD not set — skipping seed.');
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  const result = await User.updateOne(
    { email },
    {
      $setOnInsert: {
        name: 'Super Admin',
        provider: 'local',
        isVerified: true,
      },
      $set: {
        password: hashed,
        role: 'superadmin',
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log(`🛡️ Created SUPERADMIN (${email})`);
  } else {
    console.log(`🔄 Updated SUPERADMIN (${email}) password`);
  }
}

// ========== ERROR HANDLING ==========
app.use((_req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${_req.originalUrl}`));
});

app.use((err, _req, res, _next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ========== DATABASE CONNECTION & SERVER START ==========
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('📦 MongoDB connected');
  await seedSuperAdmin();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('🛑 MongoDB disconnected on app termination');
    process.exit(0);
  });
});

export default app;
