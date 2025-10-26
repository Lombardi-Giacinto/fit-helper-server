import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail, sendDeleteAccount } from '../email/email.handler.js';

const BASE_COOKIE_OPTIONS = {
    httpOnly: true,
    path: '/',
    secure: true,
    domain: 'fithelper.top',
    sameSite: 'None' // Permette l'invio di cookie tra sottodomini (api. e www.)
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
        // Pulisci i cookie senza terminare la risposta, per poter inviare lo status 403.
        res.clearCookie('access_token', BASE_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', BASE_COOKIE_OPTIONS);

        console.error('Error during token refresh:', error.name, error.message);
        res.status(403).json({ message: 'Invalid or expired refresh token.' });
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
        // Costruisci l'oggetto utente manualmente per garantire la coerenza con lo schema
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            birthdate: req.body.birthdate,
            gender: req.body.gender,
            activity: req.body.activity,
            height: req.body.height,
            weight: req.body.weight,
        };
        const user = new User(userData);
        user.authMetadata.emailVerification.lastSentAt = new Date(); // Imposta il timestamp per la prima email
        await user.save(); // Salva l'utente prima di inviare l'email per avere l'ID e la versione disponibili
        await sendVerificationEmail(user);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error during user creation:', error);
        res.status(400).json({ error: error.message });
    }
};

//Handles local user login
const loginUser = async (req, res) => { // Rendi la funzione asincrona
    const user = req.user;
    if (!user.authMetadata.emailVerification.isVerified) {
        const COOLDOWN_MINUTES = 5; // Periodo di cooldown per il reinvio dell'email
        // Controlla se è possibile inviare una nuova email di verifica (cooldown)
        if (user.authMetadata.emailVerification.lastSentAt) {
            const timeSinceLastEmail = Date.now() - user.authMetadata.emailVerification.lastSentAt.getTime();
            const minutesSinceLastEmail = timeSinceLastEmail / (1000 * 60);
            if (minutesSinceLastEmail < COOLDOWN_MINUTES) {
                return res.status(403).json({ // 403 Forbidden o 429 Too Many Requests
                    message: `Il tuo account non è verificato. Riprova a fare il login tra ${Math.ceil(COOLDOWN_MINUTES - minutesSinceLastEmail)} minuti per ricevere una nuova email di verifica.`
                });
            }
        }

        // Se il cooldown è passato o è il primo tentativo, invia una nuova email di verifica
        user.authMetadata.emailVerification.version = (user.authMetadata.emailVerification.version || 0) + 1;// Invalidate last token
        user.authMetadata.emailVerification.lastSentAt = new Date(); // Aggiorna il timestamp dell'ultimo invio
        await user.save();
        await sendVerificationEmail(user);

        return res.status(403).json({ // L'utente non può accedere finché non è verificato
            message: 'Il tuo account non è verificato. Ti abbiamo inviato una nuova email di verifica. Controlla la tua casella di posta.'
        });
    }

    setAuthCookies(res, user, req.body?.rememberMe);
    res.status(200).json({ user: clearUserData(user) });
};

const logoutUser = (req, res) => {
    res.clearCookie('access_token', BASE_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', BASE_COOKIE_OPTIONS);
    res.status(200).json({ message: 'User logged out successfully' });

}

const updateUser = async (req, res) => {
    try {
        console.log('[DEBUG] Inside updateUser controller. req.body is:', req.body);
        // Seleziona solo i campi che possono essere aggiornati per evitare il "mass assignment"
        const allowedUpdateKeys = ['firstName', 'lastName', 'birthdate', 'gender', 'activity', 'height', 'weight'];
        const updatesToApply = {};

        // Itera sui campi inviati nel body e aggiungi solo quelli permessi
        Object.keys(req.body).forEach(key => {
            if (allowedUpdateKeys.includes(key)) {
                updatesToApply[key] = req.body[key];
            }
        });

        const updatedUser = await User.findOneAndUpdate(
            req.user._id,
            { $set: updatesToApply },
            { new: true, runValidators: true }
        );
        if (!updatedUser)
            return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ user: clearUserData(updatedUser) });
    } catch (error) {
        console.error('Error during user update:', error);
        res.status(500).json({ message: "Error updating user" });
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
        sendDeleteAccount(deletedUser);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error during user deletion:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

const checkEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.status(200).json({ exists: !!user });
    } catch (error) {
        console.error('Error during email check:', error);
        res.status(500).json({ message: "Error checking email" });
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

    const verificationStatusUrl = new URL(`${process.env.FRONTEND_URL}/verificationStatus`);

    if (!token) {
        // Reindirizza al frontend con stato di errore
        verificationStatusUrl.searchParams.set('error', 'no_token');
        return res.redirect(verificationStatusUrl.toString());
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);

        const user = await User.findById(decoded.sub);
        if (!user) {
            verificationStatusUrl.searchParams.set('error', 'user_not_found');
            return res.redirect(verificationStatusUrl.toString());
        }

        // Controlla che la versione del token corrisponda alla versione di verifica corrente dell'utente
        if (decoded.version !== user.authMetadata.emailVerification.version) {
            verificationStatusUrl.searchParams.set('error', 'token_expired'); // O 'invalid_token'
            return res.redirect(verificationStatusUrl.toString());
        }
        user.authMetadata.emailVerification.isVerified = true;
        await user.save();

        setAuthCookies(res, user);
        verificationStatusUrl.searchParams.set('status', 'success');
        return res.redirect(verificationStatusUrl.toString());
    } catch (error) {
        console.error('Error during email verification:', error);
        verificationStatusUrl.searchParams.set('error', 'token_expired');
        return res.redirect(verificationStatusUrl.toString());
    }
}

const emailResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user)
            return res.status(404).json({ message: 'user_not_found' });
        if (!user.authMetadata.emailVerification.isVerified)
            return res.status(400).json({ message: 'not_verified' });
        if (user.googleId || user.facebookId)
            return res.status(400).json({ message: 'social_account' });

        if (user.authMetadata.emailDeliverability.canReceiveEmails === false) {
            console.warn(`Tentativo di invio bloccato per l'utente ${user.email}: Bloccato da SES Feedback.`);

            // Risposta non specifica all'utente per sicurezza
            return res.status(500).json({
                message: 'Si è verificato un errore tecnico nell\'invio dell\'e-mail. Contatta il supporto.'
            });
        }

        await sendPasswordResetEmail(user);
        res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) { // Messaggio di errore più generico per 500
        console.error('Error during email password reset:', error); // Logga l'errore dettagliato sul server
        res.status(500).json({ message: 'An internal server error occurred.' }); // Messaggio generico al client
    }
}

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_PASSWORD_RESET_SECRET);
        const user = await User.findOne({ _id: payload.sub });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Verifica che il token non sia già stato usato (controllo sulla versione)
        if (payload.version !== user.authMetadata.passwordReset.version) {
            return res.status(401).json({ error: 'Invalid or expired password reset token.' });
        }

        // Il pre-save hook cripterà la password e passwordVersion invalida il token
        user.password = password;
        user.authMetadata.passwordReset.version++;
        await user.save(); // Il pre-save hook cripterà la password
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