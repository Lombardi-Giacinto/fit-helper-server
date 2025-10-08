import passport from 'passport';
import { Strategy as JwtStrategy} from 'passport-jwt';
import User from '../models/user.model.js';

const jwtSecret = process.env.JWT_SECRET;

const cookieExtractor = (req) => {
    console.log("Cookies ricevuti:", req.cookies);
    let token = null;
    if (req?.cookies) token = req.cookies['access_token'];
    return token;
};

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: jwtSecret,
};

export default passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.sub);

        if (user) return done(null, user);
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));