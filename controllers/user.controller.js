import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// ==================================================
//* UTILITY FUNCTIONS
// ==================================================

// Cookie options for cross-site requests.
const CROSS_SITE_OPTIONS = {
    httpOnly: true, //prevents client-side script access
    secure: true, //only https 
    sameSite: 'None', //allows cross-site requests.
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
};
// create jwt cookie
const setAuthCookie = (res, user) => {
    // Generate JWT
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('access_token', token, CROSS_SITE_OPTIONS);
};
//Removes sensitive fields from a user document
const clearUserData = (mongooseDoc) => {
    // The rest operator contains all other fields
    const { password, googleId, createdAt, updatedAt, __v, ...userResponse } = mongooseDoc.toObject();
    return userResponse;
}

// ==================================================
// USER CONTROLLERS
// ==================================================

const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);

        setAuthCookie(res, user);
        res.status(201).json({ user: clearUserData(user) });
    } catch (error) {
        console.error('Error during user creation:', error);
        res.status(400).json({ error: error.message });
    }
};

//Handles local user login
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
        
        res.status(200).json({ user: clearUserData(updatedUser) });
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

        res.status(200).json({ message: 'User deleted successfully' });
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

/**
 * Handles the callback after a successful Google OAuth login.
 * Sets an authentication cookie and redirects the user to the frontend.
 */
const loginGoogle = (req, res) => {
    try {
        setAuthCookie(res, req.user);
        // Redirect required by the OAuth2 flow
        res.redirect(`${process.env.FRONTEND_URL}/?status=success`); 
    } catch (error) {
        console.error('Error during Google login process:', error);
        res.redirect(`${process.env.FRONTEND_URL}/?status=error`);
    }

}

// Retrieves the currently authenticated user's data.
const getMe = (req, res) => {
    res.status(200).json({ user: clearUserData(req.user) });
};

export default {
    createUser,
    loginUser,
    logutUser,
    updateUser,
    deleteUser,
    checkEmail,
    loginGoogle,
    getMe,
};