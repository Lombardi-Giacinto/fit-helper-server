import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

const createUser = (req, res) => {
    User.create({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: req.body.password,
        birthdate: req.body.birthdate,
        male: req.body.male,
        activity: req.body.activity,
        height: req.body.height,
        weight: req.body.weight
    })
        .then(user => {
            const token = jwt.sign({
                sub: user._id,
                email: user.email,
            },
                jwtSecret, { expiresIn: '1h' });

            const userResponse = user.toObject();
            delete userResponse.password;
            res.status(201).json({ user: userResponse, token: `Bearer ${token}` });
        })
        .catch(error =>
            res.status(400).json({ error: error.message })
        )
};

const loginUser = (req, res) => {
    const token = jwt.sign({
        sub: req.user._id,
        email: req.user.email,
    },
        jwtSecret, { expiresIn: '1h' });

    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.status(200).json({ user: userResponse, token: `Bearer ${token}` });
};

const updateUser = (req, res) => {
    User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(user => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
};

const deleteUser = (req, res) => {
    User.findByIdAndDelete(req.params.id)
        .then(user => {
            if (user) {
                res.status(200).json({ message: 'User deleted successfully' });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
};

const checkEmail = (req, res) => {
  User.findOne({email: req.params.email})
    .then(user => res.json({ exists: !!user }))
    .catch(error => {
      console.error(error);
      res.status(500).json({ message: error.message });
    });
};

const loginGoogle = (req, res) => {
    const { user, token } = req.user;
    const userResponse = user.toObject();
    delete userResponse.password; 

    res.status(200).json({ user: userResponse, token: `Bearer ${token}` });
}

export default { createUser, loginUser, updateUser, deleteUser ,checkEmail ,loginGoogle};