import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';


//Generates and sets authentication cookies (access_token and refresh_token)
const setAuthCookies = (res, user, rememberMe = false) => {
    // Access token
    const accessToken = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const accessTokenCookieOptions = {
        httpOnly: true,
        path: '/',
        secure: true, 
        sameSite: 'None', 
        maxAge: 15 * 60 * 1000, // 15 min
    };
    res.cookie('access_token', accessToken, accessTokenCookieOptions);

    // Refresh token
    const refreshTokenExpiresIn = rememberMe ? '7d' : '1h';
    const refreshTokenMaxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: refreshTokenExpiresIn });
    const refreshTokenCookieOptions = {
        httpOnly: true,
        path: '/',
        secure: true, // Should be true in production
        sameSite: 'None',
        maxAge: refreshTokenMaxAge,
    };
    res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);
};

//Removes sensitive fields from a user document
const clearUserData = (mongooseDoc) => {
    // The rest operator(...) contains all other fields
    const {_id ,password, googleId, createdAt, updatedAt, __v, ...userResponse } = mongooseDoc.toObject();
    return userResponse;
}

// ==================================================
// USER CONTROLLERS
// ==================================================

const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        setAuthCookies(res, user, req.body?.rememberMe);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error during user creation:', error);
        res.status(400).json({ error: error.message });
    }
};

//Handles local user login
const loginUser = (req, res) => {
    setAuthCookies(res, req.user, req.body?.rememberMe);
    res.status(200).json({ user: clearUserData(req.user) });
};

const logutUser = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: 'None',
    };

    // Clear both authentication cookies
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    res.status(200).json({ message: 'User logged out successfully' });
}

/**
 * Generates a new access_token using a valid refresh_token.
 */
const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Issue a new access token only
        const accessToken = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 15 * 60 * 1000, path: '/' });
        res.status(200).json({ message: 'Token refreshed successfully' });

    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

const updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
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

        const cookieOptions = {
            httpOnly: true,
            path: '/',
            secure: true,
            sameSite: 'None'
        };

        // Clear the only cookie that matters
        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('refresh_token', cookieOptions);

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
        // For OAuth, "remember me" is often the default behavior. You could add logic to check a query param if needed.
        setAuthCookies(res, req.user, true); // Let's assume Google login implies "remember me"
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
    refreshAccessToken,
    updateUser,
    deleteUser,
    checkEmail,
    loginGoogle,
    getMe,
};