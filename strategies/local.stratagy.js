import passport from "passport";
import { Strategy } from "passport-local";
import User from "../models/user.model.js";

//login authentication
export default passport.use(new Strategy({
    usernameField: "email",
},
    async (username, password, done) => {
        try {
            const user = await User.findOne({ email: username });
            if (!user) {
                return done(null, false, { loginError: true });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return done(null, false, { loginError: true });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));