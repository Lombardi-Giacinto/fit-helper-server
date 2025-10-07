import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/user.model.js';

const jwtSecret = process.env.JWT_SECRET;

// Funzione per estrarre il token dal cookie HttpOnly
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['access_token'];
    }
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