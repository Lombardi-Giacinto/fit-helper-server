import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({region:"eu-north-1"});

