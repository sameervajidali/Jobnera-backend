
// backend/src/app.js  (only one copy of this file, not in src/src!)
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import User   from './models/User.js';
import Role   from './models/Role.js'; 
import express from 'express';
import mongoose from 'mongoose';
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
import userRoutes from './routes/userRoutes.js';
import materialRoutes from './routes/materialRoutes.js';


const app = express();


app.use(express.json());

//SDJFLSDSD FSDF 
// 2) Base middleware
app.use(cookieParser());
app.use(cors({
  origin: ['https://jobneura.tech','https://www.jobneura.tech','http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
      // ── only set `domain` in production ──────────────────────────────
      ...(process.env.NODE_ENV === 'production'
        ? { domain: '.jobneura.tech' }    // for both jobneura.tech & www.jobneura.tech
        : {}),                             // host-only on localhost

      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path:   '/',   // optional, but explicit
    },
  })
);
app.use(
  session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
      // ❌ DO NOT set `domain` in dev—let it default to host-only
      ...(process.env.NODE_ENV === 'production'
        ? { domain: '.jobneura.tech' }    // only in prod
        : {}),

      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path:   '/',
    },
  })
);


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
app.use('/api/auth', authRoutes);

// ...
app.use('/api/user', userRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/resumes', protect, resumeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/quizzes', quizRoutes);  // all quiz endpoints live under /api/quizzes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/materials', materialRoutes);
// 5) 404 & error handler

async function seedSuperAdmin() {
  const email    = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️ SUPERADMIN_EMAIL/PASSWORD not set — skipping seed.');
    return;
  }

  // 1) Hash the password
  const hashed = await bcrypt.hash(password, 12);

  // 2) Look up the Role document
  const superRole = await Role.findOne({ name: 'SUPERADMIN' });
  if (!superRole) {
    console.error('❌ No SUPERADMIN role found! Did you seed roles already?');
    return;
  }

  // 3) Upsert the user, setting role to superRole._id
  const result = await User.updateOne(
    { email },
    {
      $setOnInsert: {
        name:       'Super Admin',
        provider:   'local',
        isVerified: true,
      },
      $set: {
        password: hashed,
        role:     superRole._id,        // ← use the ObjectId, not a string
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

// … after you connect to MongoDB, invoke it:
mongoose.connect(process.env.MONGO_URI, {/*…*/})
  .then(() => seedSuperAdmin())
  .catch(console.error);

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


