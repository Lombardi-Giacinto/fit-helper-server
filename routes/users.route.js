import express from 'express';
import passport from 'passport';
import '../strategies/local.stratagy.js';
import '../strategies/jwt.strategy.js';
import '../strategies/google.strategy.js';
import '../strategies/facebook.strategy.js';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

// ==================================================
//* REGISTRATION ROUTE
// ==================================================
router.post('/register', UserController.createUser);
router.get("/checkEmail/:email", UserController.checkEmail);
router.get('/verifyEmail/:token', UserController.emailVerification);
router.post('/resendVerification',UserController.resendVerification);
//router.post('/resetPassword',UserController.resetPassword);


// ==================================================
//* AUTHENTICATION ROUTES
// ==================================================
// Local login route using Passport's local strategy
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err); // Server error
    }
    if (!user) {
      return res.status(401).json(info);// Failed authentication
    }
    req.user = user;
    next();
  })(req, res, next);
}, UserController.loginUser);
router.get('/logout', UserController.logoutUser);

// Route to refresh the access token
router.post('/refresh', UserController.refreshAccessToken);


// ==================================================
//* SOCIAL LOGIN ROUTES (GOOGLE & FACEBOOK)
// ==================================================
// Route to start Google authentication and JWT creation
router.get('/loginGoogle/start', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
// Callback route for Google (authorized redirect URI)
router.get('/loginGoogle', passport.authenticate('google', {
  session: false,
  failureRedirect: process.env.FRONTEND_URL + '/?status=error'
}), UserController.loginGoogle);

// Route to start Facebook authentication and JWT creation
router.get('/loginFacebook/start', passport.authenticate('facebook', { scope: ['email'], session: false }));
// Callback route for Facebook (authorized redirect URI)
router.get('/loginFacebook', passport.authenticate('facebook', {
  session: false,
  failureRedirect: process.env.FRONTEND_URL + '/?status=error' // Redirect on failure
}), UserController.loginFacebook); // Sets cookie and redirects


// ==================================================
//* PROTECTED ROUTES (REQUIRE JWT AUTHENTICATION)
// ==================================================
router.put('/update', passport.authenticate('jwt', { session: false }), UserController.updateUser)
router.delete('/delete', passport.authenticate('jwt', { session: false }), UserController.deleteUser);
// Route to get user data after redirect
router.get('/me', passport.authenticate('jwt', { session: false }), UserController.getMe);

export default router;