import express from 'express';
import foodController from 'controllers/food.controller.js';

const router=express.Router();

router.get("/getFood/:name",foodController.getFood);
router.get("/getAllFoods",foodController.getAllFoods);
router.get("/getFoodByCategory/:category",foodController.getFoodByCategory);

router.post("/createFood",foodController.createFood);

export default router;