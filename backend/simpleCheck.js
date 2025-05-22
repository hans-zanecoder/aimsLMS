require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

async function simpleCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const programs = await Program.find({});
    
    console.log('\nFound', programs.length, 'programs:\n');
    
    programs.forEach(p => {
      console.log('-------------------');
      console.log('Name:', p.name);
      console.log('Duration:', p.durationValue, p.durationUnit);
      console.log('Modes:', p.instructionModes.join(', '));
      console.log('Description:', p.description || '(empty)');
      console.log('-------------------\n');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

simpleCheck(); 