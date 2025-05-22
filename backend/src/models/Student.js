const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  assignmentSubmissions: [{
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    submissionDate: Date,
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmit'],
      default: 'submitted'
    },
    grade: Number,
    feedback: String,
    files: [{
      filename: String,
      path: String,
      uploadDate: Date
    }]
  }],
  quizResults: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    attemptDate: Date,
    score: Number,
    totalQuestions: Number,
    timeSpent: Number // in minutes
  }],
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  overallProgress: {
    type: Number,
    default: 0 // Percentage of course completed
  }
});

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  coursesEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paymentProfile: {
    totalCost: {
      type: Number,
      default: 0
    },
    downPayment: {
      type: Number,
      default: 0
    },
    amountFinanced: {
      type: Number,
      default: 0
    },
    paymentFrequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly'
    },
    totalPayments: {
      type: Number,
      default: 0
    },
    paymentAmount: {
      type: Number,
      default: 0
    },
    paymentDates: [{
      type: Date
    }],
    paymentHistory: [{
      amount: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      remainingBalance: {
        type: Number,
        required: true
      }
    }]
  },
  courseProgress: [courseProgressSchema],
  accessibleMaterials: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    books: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }],
    videos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    }]
  }],
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  badges: [{
    name: String,
    description: String,
    dateEarned: Date,
    image: String
  }],
  certificates: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    issueDate: Date,
    certificateNumber: String,
    status: {
      type: String,
      enum: ['pending', 'issued'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Update lastActivityDate on any interaction
studentSchema.pre('save', function(next) {
  this.lastActivityDate = new Date();
  next();
});

// Method to update course progress
studentSchema.methods.updateCourseProgress = async function(courseId) {
  const courseProgress = this.courseProgress.find(
    progress => progress.courseId.toString() === courseId.toString()
  );

  if (courseProgress) {
    const totalModules = await mongoose.model('Course').findById(courseId).select('modules').lean();
    const completedCount = courseProgress.completedModules.length;
    const totalCount = totalModules.modules.length;
    
    courseProgress.overallProgress = Math.round((completedCount / totalCount) * 100);
    await this.save();
  }
};

// Method to check if student has access to specific material
studentSchema.methods.hasAccessTo = function(courseId, materialType, materialId) {
  const courseAccess = this.accessibleMaterials.find(
    access => access.courseId.toString() === courseId.toString()
  );

  if (!courseAccess) return false;

  return courseAccess[materialType].some(
    id => id.toString() === materialId.toString()
  );
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 