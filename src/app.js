// backend/app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import passport from './config/passport.js';
import User from './models/User.js';
import Role from './models/Role.js';
import Quiz from './models/Quiz.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import { protect } from './middlewares/authMiddleware.js';
import sessionMiddleware from './middlewares/session.js';
import notificationRoutes from './routes/notifications.js';
import eventBus from './middlewares/eventBus.js';
import blogRoutes from './routes/blogRoutes.js';
import tutorialRoutes from './routes/tutorialRoutes.js';
import subTopicRoutes from './routes/admin/subTopicRoutes.js';
// app.js or server.js
import certificateRoutes from './routes/certificateRoutes.js';
import certificateOgRoutes from './routes/certificateOgRoutes.js';
// In your main backend index.js or server.js
import ogImageRoutes from './routes/ogImageRoutes.js';
import ogRoutes from './routes/ogRoutes.js';

import blogTagRoutes from './routes/blogTagRoutes.js';
import blogCategoryRoutes from './routes/blogCategoryRoutes.js';
import blogMediaRoutes from './routes/blogMediaRoutes.js';
import blogCommentRoutes from './routes/blogCommentRoutes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// =========================
// ✅ CORS: Allow frontend to send cookies
// =========================
app.use(cors({
  origin: ['https://jobneura.tech'],
  credentials: true,
}));


app.use(sessionMiddleware);
app.use(eventBus);

// =========================
// ✅ Parse cookies before using sessions
// =========================
app.use(cookieParser());

// =========================
// ✅ Session middleware (must come after cookieParser)
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Secure cookie config for cross-site frontend (Vercel → backend)
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      domain: isProd ? '.jobneura.tech' : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);


// OpenAPI spec config (edit these details for your project)
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'JobNeura SaaS Blog API',
    version: '1.0.0',
    description: 'Full API documentation for your SaaS blog system',
    contact: { name: 'JobNeura Dev Team', email: 'support@jobneura.tech' }
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local server' },
    { url: 'https://api.jobneura.tech', description: 'Production' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // 👇👇👇 ADD ALL YOUR MODELS HERE 👇👇👇
      BlogPost: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          summary: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'review', 'scheduled', 'published', 'archived'] },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          coverImageUrl: { type: 'string' },
          seo: { type: 'object' },
          readingTime: { type: 'integer' }
        }
      },
      Tag: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          color: { type: 'string' }
        }
      },
      Category: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          order: { type: 'integer' },
          isVisible: { type: 'boolean' }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          parentComment: { type: 'string', description: 'Parent comment ID (for replies)' }
        }
      }
    }
  }
};


security: [{ bearerAuth: [] }]


const options = {
  swaggerDefinition,
  // Tell swagger-jsdoc where to look for API docs in JSDoc comments (see below)
  apis: ['./src/routes/*.js', './src/models/*.js'],

};

const swaggerSpec = swaggerJSDoc(options);



// =========================
// ✅ Logging and JSON parsing
// =========================
app.use(morgan('dev'));
app.use(express.json());

// =========================
// ✅ Passport for social login session handling
// =========================
app.use(passport.initialize());
app.use(passport.session());

// =========================
// ✅ Healthcheck & Base route
// =========================
app.get('/', (req, res) => res.send('✅ API is running...'));
app.get('/api/test', (_req, res) =>
  res.json({ success: true, message: 'API up!', time: new Date().toISOString() })
);

// =========================
// ✅ All API routes
// =========================
// 3️⃣ Mount REST routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resumes', protect, resumeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use("/api/admin/subtopics", subTopicRoutes);

app.use('/api/materials', materialRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/certificates', certificateOgRoutes);
app.use('/api/og', ogImageRoutes);

// API mount points
app.use('/api/blog', blogRoutes);
app.use('/api/blog/tags', blogTagRoutes);
app.use('/api/blog/categories', blogCategoryRoutes);
app.use('/api/blog/media', blogMediaRoutes);
app.use('/api/blog', blogCommentRoutes); // Attach to /api/blog for clarity


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Optional: redirect root to docs for easy access
app.get('/', (req, res) => res.redirect('/api/docs'));
// =========================
// ✅ Seed SuperAdmin (on startup)
// =========================
async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️ SUPERADMIN_EMAIL/PASSWORD not set — skipping seed.');
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const superRole = await Role.findOne({ name: 'SUPERADMIN' });

  if (!superRole) {
    console.error('❌ No SUPERADMIN role found! Did you seed roles already?');
    return;
  }



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
        role: superRole._id,
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

// =========================
// ✅ Connect to DB and seed superadmin
// =========================
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => seedSuperAdmin())
  .catch(console.error);


// =========================
// ❌ 404 and general error handler
// =========================
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
