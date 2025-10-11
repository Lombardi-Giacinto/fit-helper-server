import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const setAuthCookie = (res, user) => {
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        maxAge: 60 * 60 * 1000 // 1 h
    };

    // Usiamo res.setHeader per un controllo più esplicito e per evitare header multipli.
    const cookieString = cookie.serialize('access_token', token, cookieOptions);

    if (process.env.NODE_ENV === 'development')
        console.log('[DEBUG] Impostazione cookie nel controller:', cookieString);
    res.setHeader('Set-Cookie', cookieString);
};

const clearUserData = (temp) => {
    const userResponse = temp.toObject();
    delete userResponse.password;
    delete userResponse.googleId;
    delete userResponse.createdAt;
    delete userResponse.updatedAt;
    delete userResponse.__v;
    return userResponse;
}


const createUser = async (req, res) => {
    try {
        const user = await User.create({
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: req.body.password,
            birthdate: req.body.birthdate,
            gender: req.body.gender,
            activity: req.body.activity,
            height: req.body.height,
            weight: req.body.weight
        });

        setAuthCookie(res, user);
        res.status(201).json({ user: clearUserData(user) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const loginUser = (req, res) => {
    setAuthCookie(res, req.user);
    res.status(200).json({ user: clearUserData(req.user) });
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (user)
            res.status(200).json(user);
        res.status(404).json({ error: 'User not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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

const checkEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ exists: true});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
    res.status(200).json(clearUserData(req.user));
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