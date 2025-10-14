import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import User from '../models/user.model.js';

const cookieExtractor = (req) => {
    if (process.env.NODE_ENV === 'development') {
        console.log("[DEBUG] Esecuzione di cookieExtractor nella strategia JWT.");
        console.log("[DEBUG] Headers completi nella strategia:", req.headers);
    }

    console.log("COOOOOKIEEE===",req.cookies?.access_token);

    return req.cookies?.access_token || null
};

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
};

export default passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
        if (process.env.NODE_ENV === 'development')
            console.log('[DEBUG] Payload JWT ricevuto:', jwt_payload);
        const user = await User.findById(jwt_payload.sub);

    console.log("USER===",user);

        if (user) return done(null, user);
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));