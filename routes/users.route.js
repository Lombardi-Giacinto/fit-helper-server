import express from 'express';
import passport from 'passport';
import '../strategies/local.stratagy.js';
import '../strategies/jwt.strategy.js';
import '../strategies/google.strategy.js';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', UserController.createUser);
router.get("/checkEmail/:email", UserController.checkEmail);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err); // Server error
    }
    if (!user) {
      // Failed authentication
      return res.status(401).json(info);
    }
    req.user = user;
    next();
  })(req, res, next);
}, UserController.loginUser);
router.get('/logout', UserController.logutUser);



// Route to start Google authentication and JWT creation
router.get('/loginGoogle/start', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Callback route for Google (authorized redirect URI)
router.get('/loginGoogle', passport.authenticate('google', { session: false }), UserController.loginGoogle);


//* Protected routes that require jwt
router.put('/update', passport.authenticate('jwt', { session: false }), UserController.updateUser)
router.delete('/delete', passport.authenticate('jwt', { session: false }), UserController.deleteUser);
// Route to get user data
router.get('/me', passport.authenticate('jwt', { session: false }), UserController.getMe);

export default router;