const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        'Whey Protein',
        'Creatine',
        'Pre-Workout',
        'Plant Protein',
        'Multivitamin',
        'Fish Oil',
        'BCAA',
        'Other',
      ],
      default: 'Other',
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      type: [String],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'At least one image URL is required',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
