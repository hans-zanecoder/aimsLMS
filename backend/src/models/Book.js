const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  bookType: {
    type: String,
    enum: ['pdf', 'embed'],
    default: 'pdf'
  },
  pdfUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return this.bookType === 'embed' || (this.bookType === 'pdf' && v && v.length > 0);
      },
      message: 'PDF URL is required for PDF book type'
    }
  },
  embedCode: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return this.bookType === 'pdf' || (this.bookType === 'embed' && v && v.length > 0);
      },
      message: 'Embed code is required for embed book type'
    }
  },
  embedHeight: {
    type: Number,
    default: 600
  },
  coverImage: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  additionalResources: [{
    title: String,
    url: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema); 