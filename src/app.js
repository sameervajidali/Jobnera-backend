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
import publicRoutes from './routes/publicRoutes.js';

// ========== APP INITIALIZATION ==========
const app = express();

// ========== MIDDLEWARE: BASE ==========
app.use(cookieParser());
const allowedOrigins = [
    'https://www.jobneura.tech',
    'https://jobneura.tech',
    'http://localhost:5173',   // dev
];
  
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);               // allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 200,   // <— this makes OPTIONS respond with 200
};
// apply CORS to all routes
app.use(cors(corsOptions));




app.use(express.json());
app.use(morgan('dev'));



app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is working fine!',
    time: new Date().toISOString()
  });
});


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
app.use('/api/public', publicRoutes);
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


// // server.js
// // ========== ENVIRONMENT CONFIGURATION ==========
// import dotenv from 'dotenv';
// dotenv.config();

// // ========== CORE IMPORTS ==========
// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
// import session from 'express-session';
// import cookieParser from 'cookie-parser';
// import passport from './config/passport.js'; // GitHub Strategy configured here
// import User from './models/User.js';
// import { protect, requireRole } from './middlewares/authMiddleware.js';

// // ========== ROUTES ==========
// import authRoutes from './routes/authRoutes.js';
// import resumeRoutes from './routes/resumeRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import publicRoutes from './routes/publicRoutes.js';

// // ========== APP INITIALIZATION ==========
// const app = express();

// // ========== CORS WITH PREFLIGHT ==========
// const allowedOrigins = [
//   'https://www.jobneura.tech',  // prod w/ www
//   'https://jobneura.tech',      // prod root
//   'http://localhost:5173',      // your React dev server
// ];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);                // allow tools like Postman
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     callback(new Error(`CORS policy: origin ${origin} not allowed`));
//   },
//   credentials: true,
//   methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization'],
// };
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));  // handle preflight for every route

// // ========== MIDDLEWARE: BASE ==========
// app.use(cookieParser());
// app.use(express.json());
// app.use(morgan('dev'));

// // ========== MIDDLEWARE: SESSION & PASSPORT ==========
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'fallback_secret_key',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   },
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // ========== HEALTHCHECK ==========
// app.get('/api/test', (_req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Backend is working fine!',
//     time: new Date().toISOString(),
//   });
// });

// // ========== ROUTES ==========
// app.get('/', (_req, res) => res.send('✅ API is running...'));
// app.use('/api/auth', authRoutes);                   // includes GET+PUT /profile
// app.use('/api/resumes', protect, resumeRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/public', publicRoutes);

// // ========== SUPERADMIN SEEDER ==========
// async function seedSuperAdmin() {
//   const email = process.env.SUPERADMIN_EMAIL;
//   const password = process.env.SUPERADMIN_PASSWORD;
//   if (!email || !password) {
//     console.warn('⚠️ SUPERADMIN_EMAIL/PASSWORD not set — skipping seed.');
//     return;
//   }
//   const hashed = await bcrypt.hash(password, 12);
//   const result = await User.updateOne(
//     { email },
//     {
//       $setOnInsert: { name: 'Super Admin', provider: 'local', isVerified: true },
//       $set: { password: hashed, role: 'superadmin' },
//     },
//     { upsert: true }
//   );
//   console.log(
//     result.upsertedCount > 0
//       ? `🛡️ Created SUPERADMIN (${email})`
//       : `🔄 Updated SUPERADMIN (${email}) password`
//   );
// }

// // ========== ERROR HANDLING ==========
// app.use((_req, res, next) => {
//   res.status(404);
//   next(new Error(`Not Found - ${_req.originalUrl}`));
// });
// app.use((err, _req, res, _next) => {
//   const status = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(status).json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//   });
// });

// // ========== DATABASE & SERVER START ==========
// const PORT = process.env.PORT || 5000;
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log('📦 MongoDB connected');
//     await seedSuperAdmin();
//     app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection failed:', err.message);
//     process.exit(1);
//   });

// // ========== GRACEFUL SHUTDOWN ==========
// process.on('SIGINT', () => {
//   mongoose.connection.close(() => {
//     console.log('🛑 MongoDB disconnected on app termination');
//     process.exit(0);
//   });
// });

// export default app;

