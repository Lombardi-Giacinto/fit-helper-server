import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    birthdate: { type: Date },
    gender: { type: String, enum:['male', 'female', 'other'],default: 'other'  },
    activity: { type: String, enum: ['sedentary', 'lightlyActive','veryActive'], default: 'sedentary' },
    height: { type: Number, default:0},//cm
    weight: { type: Number, default:0},//Kg
},{ timestamps: true }); 

// Hook pre-save per hashare la password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
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

// this == user
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);