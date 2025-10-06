import express from 'express';
import passport from 'passport';
import '../strategies/local.stratagy.js';
import '../strategies/jwt.strategy.js';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({message: 'root unused'})
})

router.post('/register', UserController.createUser);
router.post('/login', passport.authenticate('local', { session: false }), UserController.loginUser);

// Protected route that require jwt
router.put('/:id', passport.authenticate('jwt', { session: false }), UserController.updateUser)
router.delete('/:id', passport.authenticate('jwt', { session: false }), UserController.deleteUser);

export default router;