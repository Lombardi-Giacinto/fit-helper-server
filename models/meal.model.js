import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: ["breakfast", "lunch", "dinner", "snack"],
        required: true
    },
    date: { type: Date, required: true },
    foods: [{
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, required: true }
    }]
}, { timestamps: true });

export default mongoose.model("Meal", mealSchema);