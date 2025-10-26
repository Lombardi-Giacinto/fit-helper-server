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
    if (process.env.NODE_ENV === 'development') {
        console.log("[DEBUG] Executing cookieExtractor in JWT strategy.");
        console.log("[DEBUG] Full headers in strategy:", req.headers);
    }
    return req.cookies?.access_token || null
};

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true // Passa l'oggetto req alla callback di verifica
};

// This function is called when a JWT is successfully extracted and decoded.
export default passport.use(new JwtStrategy(options, async (req, jwt_payload, done) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('[DEBUG] JWT payload received:', jwt_payload);
            // Log di debug per verificare lo stato di req.body all'interno della strategia
            console.log('[DEBUG] req.body inside JWT strategy:', req.body);
        }
        const user = await User.findById(jwt_payload.sub);

        if (user) return done(null, user);
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));