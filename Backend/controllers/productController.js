const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Admin: upload image to Cloudinary
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'muscle-garage/products',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
};

exports.getUploadMiddleware = () => upload.single('file');

// Public: list products with optional filters
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, inStock, sort } = req.query;
    const query = {};

    if (category) {
      const categories = Array.isArray(category) ? category : category.split(',');
      query.category = { $in: categories };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    let cursor = Product.find(query);
    switch (sort) {
      case 'price-asc':
        cursor = cursor.sort({ price: 1 });
        break;
      case 'price-desc':
        cursor = cursor.sort({ price: -1 });
        break;
      case 'name':
        cursor = cursor.sort({ name: 1 });
        break;
      default:
        cursor = cursor.sort({ createdAt: -1 });
    }

    const products = await cursor.exec();
    res.json({ success: true, products });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Public: get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// Admin: create
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    if (!name || !price || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: 'Name, price, and at least one image are required' });
    }
    const product = await Product.create({ name, description, price, category, stock, images });
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// Admin: update
exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Admin: delete
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
