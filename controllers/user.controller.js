import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const CROSS_SITE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 ora
};

const setAuthCookie = (res, user) => {
    // Generate JWT
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('access_token', token, CROSS_SITE_OPTIONS);
};

const clearUserData = (mongooseDoc) => {
    // The rest operator contains all other fields
    const { password, googleId, createdAt, updatedAt, __v, ...userResponse } = mongooseDoc.toObject();
    return userResponse;
}


const createUser = async (req, res) => {
    try {
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
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
        console.error('Error during user creation:', error);
        res.status(400).json({ error: error.message });
    }
};

const loginUser = (req, res) => {
    setAuthCookie(res, req.user);
    res.status(200).json({ user: clearUserData(req.user) });
};

const logutUser = (req, res) => {
    res.clearCookie('access_token', CROSS_SITE_OPTIONS);
    res.status(200).json({ message: 'User logged out successfully' });
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

        res.clearCookie('access_token', CROSS_SITE_OPTIONS);

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
        
        const publicUserData = clearUserData(req.user);
        const encodedUser = encodeURIComponent(JSON.stringify(publicUserData));
        // Redirect required by the OAuth2 flow
        res.redirect(`${process.env.FRONTEND_URL}/?status=success&user=${encodedUser}`); 
    } catch (error) {
        console.error('Error during Google login process:', error);
        res.redirect(`${process.env.FRONTEND_URL}/?status=error`);
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