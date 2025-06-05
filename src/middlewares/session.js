import session from 'express-session';
import MongoStore from 'connect-mongo';

/**
 * Express session middleware configuration
 * Stores session data in MongoDB using connect-mongo
 */
export default session({
  name: 'jid',  // Cookie name to store session ID (JWT ID)

  secret: process.env.SESSION_SECRET,  // Secret for signing the session ID cookie

  resave: false,  // Prevents session from being saved back if it was not modified

  saveUninitialized: false,  // Don't create session until something is stored

  cookie: {
    httpOnly: true,  // Prevents client-side JS access to the cookie for security

    // Set secure flag only in production to enforce HTTPS-only cookie transmission
    secure: process.env.NODE_ENV === 'production',

    // CSRF protection: restrict cookie to same-site requests (lax allows some cross-site GET)
    sameSite: 'lax',

    maxAge: 1000 * 60 * 60 * 24,  // 1 day in milliseconds
  },

  // MongoDB session store config, storing in 'sessions' collection
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24,  // Session expiration time in seconds (1 day)
  }),
});
