import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const sesClient = new SESClient({
    region: 'eu-central-1',
    credentials: fromNodeProviderChain(),
});

// Configurazione del transporter per AWS SES v3
const transporter = nodemailer.createTransport({
    // Questo transporter non verrà più usato se si invia direttamente con l'SDK
});

// Funzione per inviare un'email tramite AWS SES
export const sendEmail = async (to, subject, htmlContent) => {
    // Parametri per il comando SendEmailCommand dell'SDK di AWS SES (API v1)
    const params = {
        Source: process.env.EMAIL_FROM,
        Destination: {
            ToAddresses: [to], // L'SDK si aspetta un array di indirizzi
        },
        Message: {
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
    };

    try {
        const command = new SendEmailCommand(params);
        const data = await sesClient.send(command);
        console.log('Email sent directly via AWS SDK (v1 API). MessageId: %s', data.MessageId);
        return { success: true, messageId: data.MessageId };

    } catch (error) {
        console.error('ERROR sending email via SES SDK:', error);
        return { success: false, error: error.message };
    }
};