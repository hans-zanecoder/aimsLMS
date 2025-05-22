const mongoose = require('mongoose');

/**
 * Program Schema
 * 
 * This represents an educational program offered by the institution
 */
const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  durationValue: {
    type: String,
    trim: true
  },
  durationUnit: {
    type: String,
    enum: ['hours', 'days', 'weeks', 'months', 'years'],
    default: 'weeks'
  },
  icon: {
    type: String,
    // Base64 image or URL
  },
  instructionModes: [{
    type: String,
    enum: ['In-Person', 'Online', 'Hybrid', 'Self-Paced', 'Accelerated']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Add text index for search capabilities
programSchema.index({ 
  name: 'text', 
  description: 'text'
});

// Pre-save hook to update the updatedAt field
programSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Program = mongoose.model('Program', programSchema);

// Drop the problematic code index if it exists
(async () => {
  try {
    await Program.collection.dropIndex('code_1');
    console.log('Successfully dropped code_1 index');
  } catch (error) {
    // If the index doesn't exist, that's fine
    if (error.code !== 27) {
      console.error('Error dropping index:', error);
    }
  }
})();

module.exports = Program; 