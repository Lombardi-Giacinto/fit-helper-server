const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const router = require('./routes/api.route')
const User = require('./models/user.model');
const app = express();
const cookieParser = require('cookie-parser');


//env
require('dotenv').config();
const uri = process.env.MONGODB_URI;
const port = process.env.PORT;

app.use(express.json());app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://main.dr3pvtmhloycm.amplifyapp.com/"
    ],
    credentials: true // Opzionale: utile se gestisci cookie/sessioni cross-origin
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('secret'))

//routes
app.use("/", router);

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
    res.send('Homeeeee');
});


app.use('/api', router);
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});