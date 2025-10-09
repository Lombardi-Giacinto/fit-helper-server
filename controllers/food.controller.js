import Food from "../models/food.model";

const createFood = async (req, res) => {
    try {
        const food = await Food.create({
            name: req.body.name,
            calories: req.body.calories,
            proteins: req.body.proteins,
            carbohydrates: req.body.carbohydrates,
            fats: req.body.fats,
            category: req.body.category
        });
        res.status(201).json(food);
    } catch (error) {
        res.status(500).status({ error: error.message });
    }
}

const getAllFood = async (req, res) => {
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
        if (foods?.length > 0) {
            res.status(200).json(foods);
        } else {
            res.status(404).json({ error: "No food found for this category" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getFood = async (req, res) => {
    try {
        const food = await Food.findOne({ name: req.params.name });
        if (food)
            return res.status(200).json(food);
        res.status(404).json({ error: "No food found" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateFood = async (req, res) => {
    try {
        const food = await Food.findOneAndUpdate({ name: req.params.name }, req.body, { new: true });
        if (food)
            return res.status(200).json(food);
        res.status(404).json({ error: "No food found" });
    } catch (error) {
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
    createFood,
    getAllFood,
    getFoodByCategory,
    getFood
};