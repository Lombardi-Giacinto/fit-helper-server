import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const jwtSecret = process.env.JWT_SECRET;

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

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
          });
        }

        // Genera JWT
        const token = jwt.sign(
          { sub: user._id, email: user.email },
          jwtSecret,
          { expiresIn: "1h" }
        );

        return done(null, { user, token }); // lo passiamo al controller
      } catch (err) {
        done(err, null);
      }
    }
  )
);
