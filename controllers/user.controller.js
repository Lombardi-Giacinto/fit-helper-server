const User = require('../models/user.model');
const bcrypt = require('bcrypt');

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
                // Rimuovi la password dalla risposta
                const userResponse = user.toObject();
                delete userResponse.password;
                res.status(201).json(userResponse); // 201 Created è più appropriato
            })
            .catch(error =>
                res.status(400).json({ error: error.message })
            )
    },

    loginUser: async (req, res) => {
        const { email, password } = req.body;
        
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            const userResponse = user.toObject();
            delete userResponse.password;
            res.status(200).json(userResponse);

        } catch (error) {
            reses.status(500).json({ error: error.message });
        }
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