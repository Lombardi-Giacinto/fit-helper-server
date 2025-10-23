import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../mail/email.handler.js';

const BASE_COOKIE_OPTIONS = {
    httpOnly: true,
    path: '/',
    secure: true,
    domain: 'fithelper.top',
    sameSite: 'Lax'
}

//Generates and sets authentication cookies (access_token and refresh_token)
const setAuthCookies = (res, user, rememberMe = false) => {
    // Access token
    const accessToken = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.cookie('access_token', accessToken, {
        ...BASE_COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
    });

    // Refresh token
    const ExpiresIn = rememberMe ? '7d' : '1h';
    const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: ExpiresIn });
    res.cookie('refresh_token', refreshToken, {
        ...BASE_COOKIE_OPTIONS,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // 7 giorni o 1 ora
    });
};

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
        res.cookie('access_token', accessToken, { ...BASE_COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        res.status(200).json({ message: 'Token refreshed successfully' });

    } catch (error) {
        // Se il refresh token è scaduto o non valido, puliscilo dal browser.
        // Le opzioni per clearCookie devono corrispondere a quelle usate per impostarlo (eccetto expires/maxAge)
        logoutUser(req, res); // Usa la funzione di logout per pulire i cookie
        console.error('Error during token refresh:', error.name, error.message);
        return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }
};

//Removes sensitive fields from a user document
const clearUserData = (mongooseDoc) => {
    // The rest operator(...) contains all other fields
    const { _id, password, googleId, createdAt, updatedAt, __v, ...userResponse } = mongooseDoc.toObject();
    return userResponse;
}

// ==================================================
// USER CONTROLLERS
// ==================================================
const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        sendVerificationEmail(user);
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

const logoutUser = (req, res) => {
    // Clear both authentication cookies
    res.clearCookie('access_token', BASE_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', BASE_COOKIE_OPTIONS);
    res.status(200).json({ message: 'User logged out successfully' });
}

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

        // Clear the only cookie that matters
        res.clearCookie('access_token', BASE_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', BASE_COOKIE_OPTIONS);

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
        setAuthCookies(res, req.user, true); //Google login implies "remember me"

        res.redirect(`${process.env.FRONTEND_URL}/?status=success`);// Redirect required by the OAuth2 flow
    } catch (error) {
        console.error('Error during Google login process:', error);
        res.redirect(`${process.env.FRONTEND_URL}/?status=error`);
    }

}

// Retrieves the currently authenticated user's data.
const getMe = (req, res) => {
    res.status(200).json({ user: clearUserData(req.user) });
};

// ==================================================
// EMAIL
// ==================================================

const emailVerification = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        // Reindirizza al frontend con stato di errore
        return res.redirect(`${process.env.FRONTEND_URL}/verificationStatus?error=no_token`);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);

        const user = await User.findByIdAndUpdate(decoded.sub, { isVerified: true }, { new: true });
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/verificationStatus?error=user_not_found`);
        }

        setAuthCookies(res, user);
        return res.redirect(`${process.env.FRONTEND_URL}/verificationStatus?status=success`);
    } catch (error) {
        console.error('Error during email verification:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/verificationStatus?error=token_expired`);
    }
}

const resendVerification = async (req, res) => {
    try {
        const user = await User.findOne(req.user.email);
        if (user.isVerified)
            return res.status(400).json({ message: 'L\'account è già stato verificato.' });
        await sendVerificationEmail(user);
        res.status(200).json({ message: 'Email di verifica inviata con successo.' });
    } catch (error) {
        cconsole.error('Errore nel reinvio della verifica:', error);
        res.status(500).json({ message: 'Errore interno del server.' });
    }
}

const emailResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user)
            return res.status(404).json({ message: 'user_not_found' });
        if (!user.isVerified)
            return res.status(400).json({ message: 'not_verified' });
        if (user.googleId || user.facebookId)
            return res.status(400).json({ message: 'social_account' });

        await sendPasswordResetEmail(user);
        res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Error during email password reset:', error);
        res.status(500).json({ message: error.message });
    }
}

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_PASSWORD_RESET_SECRET);
        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        user.password = password;
        await user.save();
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error during password reset:', error);
        // Gestisci errori specifici del token (scaduto, non valido)
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid or expired password reset token.' });
        }
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

export default {
    createUser,
    emailVerification,
    resendVerification,
    emailResetPassword,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateUser,
    deleteUser,
    checkEmail,
    loginGoogle,
    getMe,
    resetPassword
}