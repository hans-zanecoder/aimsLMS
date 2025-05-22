require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

async function verifyPrograms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const programs = await Program.find({}).sort({ createdAt: 1 });
    
    console.log(`Total programs: ${programs.length}\n`);
    console.log('Programs in order:');
    console.log('================\n');
    
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.name}`);
      console.log('   Duration:', program.durationValue, program.durationUnit);
      console.log('   Modes:', program.instructionModes.join(', '));
      console.log('   Description:', program.description || '(empty)');
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

verifyPrograms(); 