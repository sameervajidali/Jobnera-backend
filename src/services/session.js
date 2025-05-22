// src/middlewares/session.js
import session from 'express-session';
import MongoStore from 'connect-mongo';

export default session({
  name: 'jid',                     // cookie name (e.g. “jid” for “JWT ID”)
  secret: process.env.SESSION_SECRET, // long, random string
  resave: false,                   // don’t save session if unmodified
  saveUninitialized: false,        // don’t create a session until something is stored
  cookie: {
    httpOnly: true,                // JS can’t read this cookie
    secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
    sameSite: 'lax',               // CSRF protection
    maxAge: 1000 * 60 * 60 * 24,   // 1 day in ms
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24,             // sessions expire after 1 day
  }),
});
