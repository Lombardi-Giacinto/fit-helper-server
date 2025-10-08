import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const jwtSecret = process.env.JWT_SECRET;

const setAuthCookie = (res, user) => {
    const token = jwt.sign({ sub: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        domain: 'fithelper.duckdns.org',
        path: '/',
        maxAge: 60 * 60 * 1000 // 1 h
    };

    // Usiamo res.setHeader per un controllo più esplicito e per evitare header multipli.
    const cookieString = cookie.serialize('access_token', token, cookieOptions);

    console.log('[DEBUG] Impostazione cookie nel controller:', cookieString);
    res.setHeader('Set-Cookie', cookieString);
};

const createUser = async (req, res) => {
    try {
        const user = await User.create({
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: req.body.password,
            birthdate: req.body.birthdate,
            male: req.body.male,
            activity: req.body.activity,
            height: req.body.height,
            weight: req.body.weight
        });

        setAuthCookie(res, user);
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(201).json({ user: userResponse });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const loginUser = (req, res) => {
    setAuthCookie(res, req.user);
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.status(200).json({ user: userResponse });
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
    User.findOne({ email: req.params.email })
        .then(user => res.json({ exists: !!user }))
        .catch(error => {
            console.error(error);
            res.status(500).json({ message: error.message });
        });
};

const loginGoogle = (req, res) => {
    try {
        setAuthCookie(res, req.user);
        // redirect richiesto dal flusso OAuth2
        res.redirect(`https://main.dr3pvtmhloycm.amplifyapp.com/status=success`);
    } catch (error) {
        console.error('Error during Google login process:', error);
        res.redirect(`https://main.dr3pvtmhloycm.amplifyapp.com/status=error`);
    }
}

const getMe = (req, res) => {
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
};

export default {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    checkEmail,
    loginGoogle,
    getMe
};