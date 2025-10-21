import nodemailer from 'nodemailer';
import { SESClient } from '@aws-sdk/client-ses';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const sesClient = new SESClient({
    region: process.env.SES_REGION || "eu-central-1",
    credentials: fromNodeProviderChain(),
});

// Configurazione del transporter per AWS SES v3
const transporter = nodemailer.createTransport({
    SES: { ses: sesClient }
});

// Funzione per inviare un'email tramite AWS SES
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent. MessageId: %s', info.messageId);

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('ERROR sending email via SES SDK:', error);

        // Controlla se l'errore è dovuto alla modalità Sandbox
        if (error.responseCode === 454) {
            console.error("L'invio potrebbe essere bloccato dalla modalità Sandbox di SES.");
        }

        return { success: false, error: error.message };
    }
};