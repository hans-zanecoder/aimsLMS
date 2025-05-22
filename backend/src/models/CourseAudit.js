const mongoose = require('mongoose');

const courseAuditSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  edstackID: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed
  },
  newData: {
    type: mongoose.Schema.Types.Mixed
  },
  changedFields: [String],
  notes: {
    type: String,
    trim: true
  }
});

// Add index for faster queries
courseAuditSchema.index({ courseId: 1, timestamp: -1 });
courseAuditSchema.index({ edstackID: 1 });

// Helper function to determine which fields changed
courseAuditSchema.statics.createAuditTrail = async function(
  courseId,
  userId,
  actionType,
  previousData,
  newData,
  notes = ''
) {
  // Calculate which fields changed
  let changedFields = [];
  
  if (actionType === 'update' && previousData && newData) {
    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(previousData),
      ...Object.keys(newData)
    ]);
    
    // Check each key for differences
    changedFields = Array.from(allKeys).filter(key => {
      // Skip certain fields like updatedAt
      if (key === 'updatedAt' || key === '__v') {
        return false;
      }
      
      // Special handling for arrays and objects
      if (Array.isArray(previousData[key]) && Array.isArray(newData[key])) {
        return JSON.stringify(previousData[key]) !== JSON.stringify(newData[key]);
      }
      
      if (
        typeof previousData[key] === 'object' && 
        previousData[key] !== null &&
        typeof newData[key] === 'object' && 
        newData[key] !== null
      ) {
        return JSON.stringify(previousData[key]) !== JSON.stringify(newData[key]);
      }
      
      // Simple value comparison
      return previousData[key] !== newData[key];
    });
  }
  
  // For create and delete actions, all fields are considered changed
  if (actionType === 'create' && newData) {
    changedFields = Object.keys(newData).filter(
      key => key !== 'updatedAt' && key !== 'createdAt' && key !== '__v'
    );
  } else if (actionType === 'delete' && previousData) {
    changedFields = Object.keys(previousData).filter(
      key => key !== 'updatedAt' && key !== 'createdAt' && key !== '__v'
    );
  }
  
  // Create the audit entry
  return this.create({
    courseId,
    edstackID: newData?.edstackID || previousData?.edstackID,
    userId,
    actionType,
    previousData,
    newData,
    changedFields,
    notes
  });
};

const CourseAudit = mongoose.model('CourseAudit', courseAuditSchema);

module.exports = CourseAudit; 