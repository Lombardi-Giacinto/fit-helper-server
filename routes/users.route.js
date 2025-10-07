import express from 'express';
import passport from 'passport';
import '../strategies/local.stratagy.js';
import '../strategies/jwt.strategy.js';
import '../strategies/google.strategy.js';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({message: 'root unused'})
})

router.post('/register', UserController.createUser);
router.get("/checkEmail/:email", UserController.checkEmail);

router.post('/login', passport.authenticate('local', { session: false }), UserController.loginUser);

// Rotta per iniziare l'autenticazione Google
router.get('/loginGoogle/start', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Rotta di callback per Google (corrisponde all'URI di reindirizzamento autorizzato)
router.get('/loginGoogle', passport.authenticate('google', { session: false }), UserController.loginGoogle);


// Protected routes that require jwt
router.put('/:id', passport.authenticate('jwt', { session: false }), UserController.updateUser)
router.delete('/:id', passport.authenticate('jwt', { session: false }), UserController.deleteUser);
// Rotta per ottenere i dati dell'utente loggato
router.get('/me', passport.authenticate('jwt', { session: false }), UserController.getMe);

export default router;