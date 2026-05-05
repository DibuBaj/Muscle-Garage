const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateWorkoutSession } = require('../controllers/aiController');

router.post('/generate-workout', authMiddleware, generateWorkoutSession);

module.exports = router;
