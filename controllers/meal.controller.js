import Meal from '../models/meal.model.js';
import Food from '../models/food.model.js';

const calculateCalories = async (req, res) => {
    try {
        const { foods } = req.body;
        let totalCalories = 0;

        for (const food of foods) {
            const foodItem = await Food.findById(food.food);
            if (!foodItem) {
                return res.status(404).json({ error: 'Food not found' });
            }
            totalCalories += foodItem.calories * food.quantity;
        }

        return res.status(200).json({ calories: totalCalories });
    } catch (error) {
        console.error('Error calculating calories:', error);
        return res.status(500).json({ error: error.message });
    }

};

const createMeal = async (req, res) => {
    
};

const getMeals = async (req, res) => { };

const getMeal = async (req, res) => { };

const updateMeal = async (req, res) => { };

const deleteMeal = async (req, res) => { };

export default {
    createMeal,
    getMeals,
    getMeal,
    updateMeal,
    deleteMeal
};