import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import User from '../models/user.model.js';

// This strategy is used to protect routes by verifying a JWT.

/**
 * Extracts the JWT from an HTTP-only cookie named 'access_token'.
 * @param {object} req - The Express request object.
 * @returns {string|null} The JWT or null if not found.
 */
const cookieExtractor = (req) => {
    return req.cookies?.access_token || null
};

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET
};

// This function is called when a JWT is successfully extracted and decoded.
export default passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('[DEBUG] JWT payload received:', jwt_payload);
        }
        const user = await User.findById(jwt_payload.sub);

        if (user) return done(null, user);
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));