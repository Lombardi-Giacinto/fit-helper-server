const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controllerl');

router.get('/', (req, res) => {
  res.json({message: 'root unused'})
})

router.post('/register', UserController.createUser);
router.post('/login',UserController.loginUser);

router.put('/:id',UserController.updateUser)

router.delete('/:id',UserController.deleteUser);

module.exports = router;