import { Strategy as GitHubStrategy } from 'passport-github2';
import passport from 'passport';
import User from '../models/User.js';
import Role from '../models/Role.js';
passport.use(
  new GitHubStrategy(

    {
      clientID: process.env.GITHUB_CLIENT_ID || 'Ov23lid4mBMrp2GmrdLo',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '4a570a277fc15fc34825e3cff8867dc69d59fc6c',
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ email });


        if (!user) {

          // 1️⃣ lookup default USER role
          const defaultRole = await Role.findOne({ name: 'USER' });
          if (!defaultRole) {
            return done(new Error('Default USER role not found'), null);
          }

          // 2️⃣ create user with that role
          user = await User.create({
            name: profile.displayName || profile.username || 'GitHub User',
            email,
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
            provider: 'github',
            role:       defaultRole._id,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Required for passport to work
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

export default passport;
