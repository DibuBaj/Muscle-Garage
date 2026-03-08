const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Get all trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      trainers
    });
  } catch (err) {
    console.error('Get trainers error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainers'
    });
  }
};

// Get trainer by ID
exports.getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }
    res.json({
      success: true,
      trainer
    });
  } catch (err) {
    console.error('Get trainer error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainer'
    });
  }
};

// Create trainer
exports.createTrainer = async (req, res) => {
  try {
    const { name, type, experience, phone, rate } = req.body;
    // Handle social media fields from FormData
    // Try multiple patterns since FormData with bracket notation can vary
    let instagram = req.body['socialMedia[instagram]'] || req.body.instagram || '';
    let facebook = req.body['socialMedia[facebook]'] || req.body.facebook || '';
    let x = req.body['socialMedia[x]'] || req.body.x || '';

    // Validate required fields
    if (!name || !type || !phone || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, phone, and rate are required'
      });
    }

    let certificationData = {};

    // Handle certificate upload if file exists
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'trainers/certifications',
          resource_type: 'auto'
        });
        
        console.log('=== CLOUDINARY UPLOAD RESPONSE ===');
        console.log('Full result object:', JSON.stringify(result, null, 2));
        console.log('secure_url:', result.secure_url);
        console.log('url:', result.url);
        console.log('public_id:', result.public_id);
        console.log('================================');
        
        // Use secure_url as the primary option, fallback to url if not available
        const certificateUrl = result.secure_url || result.url;
        
        if (!certificateUrl) {
          throw new Error('No URL returned from Cloudinary upload');
        }
        
        certificationData = {
          url: certificateUrl,
          publicId: result.public_id
        };
        
        console.log('Storing certificate data:', certificationData);
        
        // Delete local file after upload
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload certificate: ' + uploadErr.message
        });
      }
    }

    const trainer = new Trainer({
      name,
      type,
      experience: experience || 0,
      certification: certificationData,
      phone,
      socialMedia: {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        x: x.trim()
      },
      rate: parseInt(rate, 10),
      isActive: true
    });

    await trainer.save();

    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      trainer
    });
  } catch (err) {
    console.error('Create trainer error:', err);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create trainer'
    });
  }
};

// Update trainer
exports.updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, experience, phone, rate } = req.body;
    // Handle social media fields from FormData
    let instagram = req.body['socialMedia[instagram]'] || req.body.instagram || '';
    let facebook = req.body['socialMedia[facebook]'] || req.body.facebook || '';
    let x = req.body['socialMedia[x]'] || req.body.x || '';

    // Validate required fields
    if (!name || !type || !phone || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, phone, and rate are required'
      });
    }

    let trainer = await Trainer.findById(id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Handle certificate upload if new file is provided
    if (req.file) {
      try {
        // Delete old certificate if exists
        if (trainer.certification && trainer.certification.publicId) {
          await cloudinary.uploader.destroy(trainer.certification.publicId);
        }

        // Upload new certificate
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'trainers/certifications',
          resource_type: 'auto'
        });
        
        console.log('=== CLOUDINARY UPDATE RESPONSE ===');
        console.log('Full result object:', JSON.stringify(result, null, 2));
        console.log('secure_url:', result.secure_url);
        console.log('url:', result.url);
        console.log('public_id:', result.public_id);
        console.log('===================================');
        
        // Use secure_url as the primary option, fallback to url if not available
        const certificateUrl = result.secure_url || result.url;
        
        if (!certificateUrl) {
          throw new Error('No URL returned from Cloudinary upload');
        }
        
        trainer.certification = {
          url: certificateUrl,
          publicId: result.public_id
        };
        
        console.log('Storing updated certificate data:', trainer.certification);
        
        // Delete local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload certificate: ' + uploadErr.message
        });
      }
    }

    trainer.name = name;
    trainer.type = type;
    trainer.experience = experience || 0;
    trainer.phone = phone;
    trainer.socialMedia = {
      instagram: instagram.trim(),
      facebook: facebook.trim(),
      x: x.trim()
    };
    trainer.rate = parseInt(rate, 10);

    await trainer.save();

    res.json({
      success: true,
      message: 'Trainer updated successfully',
      trainer
    });
  } catch (err) {
    console.error('Update trainer error:', err);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update trainer'
    });
  }
};

// Delete trainer
exports.deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = await Trainer.findById(id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Delete certificate from cloudinary if exists
    if (trainer.certification && trainer.certification.publicId) {
      try {
        await cloudinary.uploader.destroy(trainer.certification.publicId);
      } catch (deleteErr) {
        console.error('Cloudinary delete error:', deleteErr);
      }
    }

    // Delete all bookings associated with this trainer
    await Booking.deleteMany({ trainerId: id });

    await Trainer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Trainer deleted successfully'
    });
  } catch (err) {
    console.error('Delete trainer error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trainer'
    });
  }
};

// Toggle trainer active status
exports.toggleTrainerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = await Trainer.findById(id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer.isActive = !trainer.isActive;
    await trainer.save();

    res.json({
      success: true,
      message: `Trainer ${trainer.isActive ? 'activated' : 'deactivated'} successfully`,
      trainer
    });
  } catch (err) {
    console.error('Toggle trainer status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update trainer status'
    });
  }
};
