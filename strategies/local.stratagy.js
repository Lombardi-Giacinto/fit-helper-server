import passport from "passport";
import { Strategy } from "passport-local";
import User from "../models/user.model.js";

// This strategy is used for standard authentication
export default passport.use(new Strategy({
    // Override usernameField:"username"
    usernameField: "email",
},
    async (username, password, done) => {
        // done(err, user, info)
        try {
            const user = await User.findOne({ email: username });
            if (!user) {
                return done(null, false, { loginError: 'auth_error' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return done(null, false, { loginError: 'auth_error' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));