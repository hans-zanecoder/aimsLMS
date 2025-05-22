require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

const newProgram = {
  name: 'Up-do Hairstyling',
  durationValue: '24',
  durationUnit: 'hours',
  instructionModes: ['In-Person', 'Online']
};

async function addProgram() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create the new program
    const program = new Program(newProgram);
    const result = await program.save();
    
    console.log('\nCreated new program:');
    console.log('- Name:', result.name);
    console.log('- Duration:', result.durationValue, result.durationUnit);
    console.log('- Instruction Modes:', result.instructionModes);

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
addProgram(); 