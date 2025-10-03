const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const router = require('./routes/api.route');
const app = express();
const cookieParser = require('cookie-parser');


//env
require('dotenv').config();
const uri = process.env.MONGODB_URI;
const port = process.env.PORT;
const cookieSecret = process.env.COOKIE_SECRET || 'default-secret';

//CORS
const allowedOrigins = [
  "https://main.dr3pvtmhloycm.amplifyapp.com",
  "http://localhost:5173"
];
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) {
      // richieste dirette dal server (curl, postman)
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, origin); // Pass the specific origin back
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(cookieSecret));

//routes
app.get('/', (req, res) => {
    res.send('Home3');
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
mongoose.connect(uri)
    .then(() => {
        console.log('Connesso a MongoDB');
        app.listen(port, () => {
            console.log(`Server in ascolto su http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Connection error MongoDB:', err);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.send('Home2');
});