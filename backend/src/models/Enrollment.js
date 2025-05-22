const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  hoursStudied: {
    type: Number,
    default: 0
  },
  pendingAssignments: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for userId and programId to ensure unique enrollments
enrollmentSchema.index({ userId: 1, programId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema); 