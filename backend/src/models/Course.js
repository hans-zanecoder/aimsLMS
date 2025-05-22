const mongoose = require('mongoose');

// Review sub-schema
const reviewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  campus: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['English', 'Spanish'],
    default: 'English'
  },
  edstackID: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  image: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  // Schedule information
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  classDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  classStartTime: {
    type: String
  },
  classEndTime: {
    type: String
  },
  totalWeeks: {
    type: Number
  },
  hoursPerWeek: {
    type: Number
  },
  modules: [{
    title: String,
    description: String,
    lessons: [{
      title: String,
      content: String,
      duration: Number, // in minutes
      resourcesUrls: [String],
      videoUrl: String,
      isCompleted: {
        type: Boolean,
        default: false
      }
    }]
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  prerequisites: [String],
  learningObjectives: [String],
  tags: [String],
  price: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  totalEnrollment: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate edstackID on save if not provided
courseSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Calculate average rating if there are reviews
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  }
  
  // If edstackID is not set, generate it
  if (!this.edstackID && this.programId && this.startDate) {
    try {
      // Get program code (first two letters)
      const Program = mongoose.model('Program');
      const program = await Program.findById(this.programId);
      let programCode = '';
      
      if (program) {
        // Take first letter of each word in program name
        programCode = program.name
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 2);
      } else {
        // Fallback: Use first two letters of category
        programCode = this.category.substring(0, 2).toUpperCase();
      }
      
      // Language code (E for English, S for Spanish)
      const languageCode = this.language === 'Spanish' ? 'S' : 'E';
      
      // Start date in MMYY format
      const startDate = new Date(this.startDate);
      const monthStr = String(startDate.getMonth() + 1).padStart(2, '0');
      const yearStr = String(startDate.getFullYear()).substring(2);
      const dateCode = `${monthStr}${yearStr}`;
      
      // Instructor initials
      const User = mongoose.model('User');
      const instructor = await User.findById(this.instructorId);
      let instructorInitials = 'XX';
      
      if (instructor) {
        instructorInitials = 
          (instructor.firstName ? instructor.firstName.charAt(0).toUpperCase() : 'X') +
          (instructor.lastName ? instructor.lastName.charAt(0).toUpperCase() : 'X');
      }
      
      // Campus code
      let campusCode = 'XX';
      if (this.campus) {
        const campusCodes = {
          'Santa Ana': 'SA',
          'South Gate': 'SG',
          'Online': 'ON',
          'Hybrid': 'HY'
        };
        
        const normalizedCampus = Object.keys(campusCodes).find(
          key => this.campus.toLowerCase().includes(key.toLowerCase())
        );
        
        if (normalizedCampus) {
          campusCode = campusCodes[normalizedCampus];
        } else {
          // Default to first two letters of campus
          campusCode = this.campus.substring(0, 2).toUpperCase();
        }
      }
      
      // Combine all parts to form the edstackID
      this.edstackID = `${programCode}${languageCode}${dateCode}${instructorInitials}${campusCode}`;
    } catch (error) {
      console.error('Error generating edstackID:', error);
      // Don't block save if edstackID generation fails
    }
  }
  
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 