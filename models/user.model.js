import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Password is only required if the user is not signing up with Google or Facebook
    password: { type: String, required: function() { return !this.googleId && !this.facebookId; } },
    // OAuth provider IDs. `sparse: true` creates a unique index
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    birthdate: { type: Date },
    gender: { type: String, enum:['male', 'female', 'other'],default: 'other'  },
    activity: { type: String, enum: ['sedentary', 'lightlyActive','veryActive'], default: 'sedentary' },
    height: { type: Number, default:0},//cm
    weight: { type: Number, default:0},//Kg
},{ timestamps: true }); 

//Pre-save hook to hash the user's password before saving it to the database
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

/**
 * Compares a candidate password with the user's hashed password.
 * @param {string} candidatePassword - The password to compare.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);