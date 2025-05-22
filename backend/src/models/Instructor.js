const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  startDate: {
    type: String,
    required: false,
    trim: true
  },
  profilePic: {
    type: String,
    trim: true
  },
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Instructor', instructorSchema); 