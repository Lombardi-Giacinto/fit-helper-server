const User = require('../models/user.model');

module.exports = {
    createUser: (req, res) => {
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
                res.cookie("user", user.id, { maxAge: 900000, httpOnly: true })
                    .status(200).json(user);
            }

            )
            .catch(error =>
                res.status(500).json({ error: error.message })
            )
    },

    loginUser: (req, res) => {
        User.findOne({
            email: req.body.email,
            password: req.body.password
        })
            .then(user => {
                if (user) res.status(200).json(user)
                else res.status(404).json({ error: 'User not found' })
            })
            .catch(error =>
                res.status(500).json({ error: error.message })
            )
    },

    updateUser: (req, res) => {
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
    },

    deleteUser: (req, res) => {
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
    },

}