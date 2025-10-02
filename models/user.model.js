const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthdate: { type: Date, required: true },
    male: { type: Boolean, required: true },//false== female
    activity: { type: String, enum: ['sedentary', 'lightlyActive','veryActive'], default: 'sedentary' },
    height: { type: Number, default:0},//cm
    weight: { type: Number, default:0},//Kg
},{ timestamps: true }); 

const User = mongoose.model("User", userSchema);
module.exports = User;