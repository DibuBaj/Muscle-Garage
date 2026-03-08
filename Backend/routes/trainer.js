const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  toggleTrainerStatus
} = require('../controllers/trainerController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Configure multer for disk storage (for certificate uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/trainer-certificates/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .png, .gif) and PDF files are allowed'), false);
    }
  },
});

// Get all trainers
router.get('/all', getAllTrainers);

// Admin routes (must come before /:id to avoid conflicts)
// Create trainer
router.post('/admin/create', adminMiddleware, upload.single('certification'), createTrainer);

// Update trainer
router.put('/admin/:id', adminMiddleware, upload.single('certification'), updateTrainer);

// Delete trainer
router.delete('/admin/:id', adminMiddleware, deleteTrainer);

// Toggle trainer status
router.patch('/admin/:id/status', adminMiddleware, toggleTrainerStatus);

// Get trainer by ID (must come after /admin routes)
router.get('/:id', getTrainerById);

module.exports = router;
