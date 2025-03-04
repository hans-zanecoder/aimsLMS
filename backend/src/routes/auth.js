const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Input validation functions
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

const validateProfile = (data) => {
  const errors = {};
  
  if (data.email) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }
  
  if (data.firstName !== undefined && (!data.firstName || data.firstName.trim() === '')) {
    errors.firstName = 'First name is required';
  }
  
  if (data.lastName !== undefined && (!data.lastName || data.lastName.trim() === '')) {
    errors.lastName = 'Last name is required';
  }
  
  if (data.phone) {
    // Basic phone validation - can be improved based on your requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Invalid phone number format';
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.accountLocked) {
      // Check if lock period has expired
      if (user.lockUntil && user.lockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockUntil - new Date()) / (60 * 1000));
        return res.status(401).json({ 
          message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` 
        });
      } else {
        // Lock period expired, unlock the account
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Handle failed login attempt
      await user.incrementLoginAttempts();
      
      // Check if account is now locked
      if (user.accountLocked) {
        const minutesLeft = Math.ceil((user.lockUntil - new Date()) / (60 * 1000));
        return res.status(401).json({ 
          message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` 
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid email or password',
        attemptsLeft: 5 - user.failedLoginAttempts
      });
    }

    // Reset failed login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Return user info (excluding password)
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        location: user.location || '',
        department: user.department || '',
        joinDate: user.joinDate || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});

// Get current user route
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile route
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, location, department, joinDate } = req.body;
    
    // Validate input
    const validationErrors = validateProfile(req.body);
    if (validationErrors) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }
    
    // Check if email is unique if changing email
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Find user and update
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (department !== undefined) user.department = department;
    if (joinDate !== undefined) user.joinDate = joinDate;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Refresh token route
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Generate a new token
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token', error: error.message });
  }
});

// Password reset request route
router.post('/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.json({ message: 'If a user with that email exists, a password reset link has been sent' });
    }
    
    // Generate a reset token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Short expiry for security
    );
    
    // In a real application, you would send an email with the reset token/link
    // For this example, we'll just return it in the response
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    // In production, you would store the token hash in the database
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();
    
    res.json({ message: 'If a user with that email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Password reset route
router.post('/password-reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check token purpose
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid token purpose' });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update password
    user.password = newPassword; // This will be hashed by the pre-save hook
    
    // Clear reset token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password route (for logged in users)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate passwords
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword; // This will be hashed by the pre-save hook
    await user.save();
    
    res.json({ message: 'Password has been changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 