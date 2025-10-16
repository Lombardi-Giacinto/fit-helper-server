import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/user.model.js";

// This strategy is used for authenticating users via their Facebook account
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/users/loginFacebook`,
    profileFields: ['id', 'displayName', 'email'],
    passReqToCallback: true
},
    // This function is called after successful authentication with Facebook
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });

            if (!user) {
                user = await User.create({
                    facebookId: profile.id,
                    // Email might not always be available
                    email: profile.emails?.[0]?.value, 
                    firstName: profile.displayName.split(' ')[0],
                    lastName: profile.displayName.split(' ').slice(1).join(' ')
                });
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));