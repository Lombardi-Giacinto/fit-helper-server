import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import User from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://fithelper.duckdns.org/api/users/loginGoogle",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Cerca o crea l'utente
        let user = await User.findOne({ googleId: profile.id });

        console.log(profile);

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.name?.givenName || profile.displayName,
            surname: profile.name?.familyName || ''
          });
        }
 
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
