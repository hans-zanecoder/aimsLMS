const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);

    if (!settings) {
      // If settings don't exist, create default settings
      settings = await UserSettings.create({
        userId: req.user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: '',
        bio: ''
      });
    }

    // Add email from user model
    const response = {
      ...settings.toObject(),
      email: user.email
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { firstName, lastName, phone, bio },
      { new: true, upsert: true }
    );

    const user = await User.findById(req.user.id);
    
    // Add email from user model to response
    const response = {
      ...settings.toObject(),
      email: user.email
    };

    res.json(response);
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 