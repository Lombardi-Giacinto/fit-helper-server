import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const setAuthCookie = (res, user) => {
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'None',
        path: '/',
        maxAge: 60 * 60 * 1000 // 1 h
    };

    res.cookie('access_token', token, cookieOptions);
};

const clearUserData = (mongooseDoc) => {
    // The rest operator contains all other fields
    const { password, googleId, createdAt, updatedAt, __v, ...userResponse } = mongooseDoc.toObject();
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

const logutUser = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'None',
        path: '/',
    };
    res.clearCookie('access_token', cookieOptions);
    res.status(200).json({ message: 'User logged out successfully'});
}

const updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedUser)
            return res.status(404).json({ error: 'User not found' });

        //setAuthCookie(res, updatedUser);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.user._id,)

        if (!deletedUser)
            return res.status(404).json({ error: 'User not found' });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'None',
            path: '/',
        };
        res.clearCookie('access_token', cookieOptions);

        res.status(200).json({ message: 'User deleted successfully', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.status(200).json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const loginGoogle = (req, res) => {
    try {
        setAuthCookie(res, req.user);
        // Redirect required by the OAuth2 flow
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
    logutUser,
    updateUser,
    deleteUser,
    checkEmail,
    loginGoogle,
    getMe
};