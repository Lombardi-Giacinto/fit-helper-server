import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import User from "../models/user.model.js";

// This strategy is used for authenticating users via their Google account.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/users/loginGoogle`,
      passReqToCallback: true,
    },
    // This function is called after successful authentication with Google.
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Find an existing user or create a new one.
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || '',
            isVerified: true,
          });
        }
 
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
