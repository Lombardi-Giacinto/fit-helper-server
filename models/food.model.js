import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true,unique: true},
  calories: {type:Number, required: true},
  protein: {type:Number, required: true},
  carbs: {type:Number, required: true},
  fat: {type:Number, required: true},
  catecategory: {
    type: String,
    enum: ["meat", "fish", "fruit", "vegetable", "grain", "dairy", "other"],
    default: "other"
  },
},{ timestamps: true });

export default mongoose.model("Food",foodSchema);