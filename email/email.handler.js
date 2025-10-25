import jwt from 'jsonwebtoken';
import { sendEmail } from './email.service.js';


export const sendVerificationEmail = async (user) => {
    const verificationToken = jwt.sign(
        { sub: user._id, emailVerificationVersion: user.authMetadata.emailVerificationVersion },
        process.env.JWT_VERIFICATION_SECRET,
        { expiresIn: '1d' }
    );
    const verificationURL = `${process.env.BACKEND_URL}/api/users/verifyEmail/${verificationToken}`;
    console.log("Verification URL:", verificationURL);

    const htmlContent = `<h1>Ciao ${user.firstName} ${user.lastname},</h1><p>Clicca sul link qui sotto per verificare la tua email e attivare il tuo account FitHelper:</p><a href="${verificationURL}">Verifica Account</a>`;

    await sendEmail(
        user.email,
        'Conferma il tuo indirizzo email',
        htmlContent
    );
};

export const sendPasswordResetEmail = async (user) => {
    const restToken = jwt.sign({
        sub: user._id, passwordVersion: user.authMetadata.passwordVersion }, // Aggiungi la versione della password
        process.env.JWT_PASSWORD_RESET_SECRET,
        { expiresIn: '1h' }
    );

    const resetURL = `${process.env.FRONTEND_URL}/passwordReset?token=${restToken}`;
    console.log("Reset URL:", resetURL);
    const htmlContent = `<h1>Ciao ${user.firstName},</h1><p>Hai richiesto di reimpostare la tua password. Clicca sul link qui sotto per procedere:</p><a href="${resetURL}">Reimposta Password</a><p>Se non hai richiesto tu questa operazione, puoi ignorare questa email.</p>`;

    await sendEmail(
        user.email,
        'Reimposta la tua password',
        htmlContent
    );
};

export const sendDeleteAccount = async (user) => {
    const htmlContent = `<h1>Ciao ${user.firstName},</h1><pp>Il tuo account FitHelper è stato eliminato con successo. Ci dispiace vederti andare via!</p><p>Se hai eliminato il tuo account per errore o hai bisogno di assistenza, non esitare a contattarci.</p>`;

    await sendEmail(
        user.email,
        'Conferma eliminazione account FitHelper',
        htmlContent
    );
};