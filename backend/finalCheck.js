require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

async function finalCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const programs = await Program.find({}).sort({ createdAt: 1 });
    
    // Simple list of names first
    console.log('\nProgram names in order:');
    programs.forEach((p, i) => console.log(`${i + 1}. ${p.name}`));
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Then details
    console.log('\nDetailed program info:');
    for (const p of programs) {
      console.log('\n----------------------------------------');
      console.log('Name:', p.name);
      console.log('Duration:', p.durationValue, p.durationUnit);
      console.log('Modes:', p.instructionModes.join(', '));
      console.log('Description:', p.description || '(empty)');
    }
    
    await mongoose.connection.close();
    console.log('\n----------------------------------------');
    console.log('Total programs:', programs.length);
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

finalCheck(); 