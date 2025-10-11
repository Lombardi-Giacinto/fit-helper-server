import express from 'express'
import usersRouter from './users.route.js'
import foodRouter from './food.route.js'

const router = express.Router()
router.use('/users', usersRouter)
router.use('/foods', foodRouter)

export default router;