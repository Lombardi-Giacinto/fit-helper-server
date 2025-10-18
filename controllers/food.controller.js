import Food from '../models/food.model.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


const s3 = new S3Client({ region: 'eu-central-1' });
// Generates a pre-signed URL for a food image from S3.
const getFoodImageUrl = (foodName) => {
    const command = new GetObjectCommand({
        Bucket: 'fithelper-images',
        Key: `foods/${foodName.toLowerCase()}.webp`,
    });
    return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
};

// ==================================================
// FOOD CONTROLLERS
// ==================================================
const createFood = async (req, res) => {
    try {
        await Food.create({
            name: req.body.name,
            calories: req.body.calories,
            protein: req.body.protein,
            carbs: req.body.carbs,
            fat: req.body.fat,
            category: req.body.category
        });
        res.status(201).json({ message: "Food created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const getAllFoods = async (req, res) => {
    try {
        const foods = await Food.find();
        for (const food of foods) {
            food.imageUrl = await getFoodImageUrl(food.name);
        }
        res.status(200).json(foods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const getFoodByCategory = async (req, res) => {
    try {
        const foods = await Food.find({ category: req.params.category });
        if (foods.length > 0) {
            for (const food of foods) {
                food.imageUrl = await getFoodImageUrl(food.name);
            }
            return res.status(200).json(foods);
        }

        res.status(404).json({ error: "No food found for this category" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const getFood = async (req, res) => {
    try {
        const food = await Food.findOne({ name: req.params.name });
        if (!food)
            return res.status(404).json({ error: "Food not found" });

        const signedUrl = await getFoodImageUrl(food.name);
        res.status(200).json({ food, imageUrl: signedUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const updateFood = async (req, res) => {
    try {
        const updatedFood = await Food.findOneAndUpdate({ name: req.params.name }, req.body, { new: true, runValidators: true });
        if (!updatedFood)
            return res.status(404).json({ error: "Food not found" });

        res.status(200).json(updatedFood);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const deleteFood = async (req, res) => {
    try {
        const food = await Food.findOneAndDelete({ name: req.params.name });
        if (food)
            return res.status(200).json({ message: "Food deleted successfully" });
        res.status(404).json({ error: "Food not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}


export default {
    getFood,
    createFood,
    getAllFoods,
    getFoodByCategory,
    updateFood,
    deleteFood
};