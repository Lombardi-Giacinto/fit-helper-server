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
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(cookieSecret));

//routes
app.get('/', (req, res) => {
    res.send('Home3');
});
app.use('/api', router);

// Connection to MongoDB
mongoose.connect(uri)
    .then(() => {
        console.log('Connesso a MongoDB');
        app.listen(port, () => {
            console.log(`Server in ascolto su http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Connection error MongoDB:', err);
    });

app.get('/', (req, res) => {
    res.send('Home2');
});


app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});