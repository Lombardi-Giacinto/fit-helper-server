import nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const sesClient = new SESv2Client({
    region: 'eu-central-1',
    credentials: fromNodeProviderChain(),
});

// Configurazione del transporter per AWS SES v3
const transporter = nodemailer.createTransport({
    SES: { ses: sesClient, aws: { SendEmailCommand } }
});

// Funzione per inviare un'email tramite AWS SES
export const sendEmail = async (to, subject, htmlContent) => {
    // Parametri per il comando SendEmailCommand dell'SDK di AWS SESv2
    const params = {
        FromEmailAddress: process.env.EMAIL_FROM,
        Destination: {
            ToAddresses: [to], // L'SDK si aspetta un array di indirizzi
        },
        Content: {
            Simple: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: 'UTF-8',
                    },
                },
            },
        },
    };

    try {
        // Invia l'email usando direttamente il client dell'SDK
        const command = new SendEmailCommand(params);
        const data = await sesClient.send(command);
        console.log('Email sent directly via AWS SDK. MessageId: %s', data.MessageId);
        return { success: true, messageId: data.MessageId };

    } catch (error) {
        console.error('ERROR sending email via SES SDK:', error);
        return { success: false, error: error.message };
    }
};