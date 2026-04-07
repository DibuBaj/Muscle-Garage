const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  toggleTrainerStatus
} = require('../controllers/trainerController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Vercel/serverless file system is read-only. Use in-memory uploads there.
const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

let storage;
if (isServerless) {
  storage = multer.memoryStorage();
} else {
  const uploadDir = path.join('uploads', 'trainer-certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

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

const uploadCertification = (req, res, next) => {
  upload.single('certification')(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      const isFileSizeError = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        success: false,
        message: isFileSizeError
          ? 'Certification file is too large. Maximum size is 5MB.'
          : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid certification upload',
    });
  });
};

// Get all trainers
router.get('/all', getAllTrainers);

// Admin routes (must come before /:id to avoid conflicts)
// Create trainer
router.post('/admin/create', adminMiddleware, uploadCertification, createTrainer);

// Update trainer
router.put('/admin/:id', adminMiddleware, uploadCertification, updateTrainer);

// Delete trainer
router.delete('/admin/:id', adminMiddleware, deleteTrainer);

// Toggle trainer status
router.patch('/admin/:id/status', adminMiddleware, toggleTrainerStatus);

// Get trainer by ID (must come after /admin routes)
router.get('/:id', getTrainerById);

module.exports = router;
