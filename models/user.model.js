const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthdate: { type: Date, required: true },
    male: { type: Boolean, required: true },//false == female
    activity: { type: String, enum: ['sedentary', 'lightlyActive','veryActive'], default: 'sedentary' },
    height: { type: Number, default:0},//cm
    weight: { type: Number, default:0},//Kg
},{ timestamps: true }); 

// Hook pre-save per hashare la password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;