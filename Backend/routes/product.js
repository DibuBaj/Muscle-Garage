const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const productController = require('../controllers/productController');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin
router.post('/', adminMiddleware, createProduct);
router.put('/:id', adminMiddleware, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

// Admin: Image upload
router.post('/upload', adminMiddleware, productController.getUploadMiddleware(), productController.uploadImage);

module.exports = router;
