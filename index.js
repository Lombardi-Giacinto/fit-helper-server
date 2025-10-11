  import cors from 'cors';
import { corsOptions } from './src/cors.js';
import express from 'express';
import mongoose from 'mongoose';
import router from './routes/api.route.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';

const app = express();

//security
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);
mongoose.set('strictPopulate', true);

app.use(cors(corsOptions));
app.use(hpp());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false, // Disable  X-RateLimit-*
});
app.use(limiter);

//other middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    console.log('[DEBUG] Headers della richiesta:', req.headers);
    console.log('[DEBUG] Cookie ricevuti da cookieParser:', req.cookies);
    next();
  });
}
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

//routes
app.get('/', (req, res) => {
  res.json('Home Test');
});
app.use('/api', router);


// Catch-all for 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connection to MongoDB and server start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connesso a MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`Server in ascolto su http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Connection error MongoDB:', err);
    process.exit(1);
  });