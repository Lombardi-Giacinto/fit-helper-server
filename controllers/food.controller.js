import Food from '../models/food.model.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'eu-central-1' });

const createFood = async (req, res) => {
    try {
        const food = await Food.create({
            name: req.body.name,
            calories: req.body.calories,
            protein: req.body.protein,
            carbs: req.body.carbs,
            fat: req.body.fat,
            category: req.body.category
        });
        res.status(201).json(food);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getAllFoods = async (req, res) => {
    try {
        const foods = await Food.find();
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getFoodByCategory = async (req, res) => {
    try {
        const foods = await Food.find({ category: req.params.category });
        if (foods?.length > 0)
            return res.status(200).json(foods);

        res.status(404).json({ error: "No food found for this category" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getFood = async (req, res) => {
    try {
        const food = await Food.findOne({ name: req.params.name });
        if (!food)
            return res.status(404).json({ error: "Food not found" });

        const signedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: 'fithelper-images',
                Key: `foods/${food.name.toLowerCase()}.webp`,
            }),
            { expiresIn: 60 * 5 } // 5 minuti
        );

        res.status(200).json({ food, imageUrl: signedUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const updateFood = async (req, res) => {
    try {
        const food = await Food.findOneAndUpdate({ name: req.params.name }, req.body, { new: true });
        if (!food)
            return res.status(404).json({ error: "Food not found" });

        res.status(200).json({ imageUrl: signedUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const deleteFood = async (req, res) => {
    try {
        const food = await Food.findOneAndDelete({ name: req.params.name });
        if (food)
            return res.status(200).json("Food deleted successfully");
        res.status(404).json({ error: "No food found" });
    } catch (error) {
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