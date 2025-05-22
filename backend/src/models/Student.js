const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 