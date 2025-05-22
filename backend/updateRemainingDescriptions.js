require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

const programDescriptions = [
  {
    name: 'Microshading Program',
    description: 'Advanced microshading training program covering powder-effect brow techniques, color theory, and safe application practices.'
  },
  {
    name: 'Microblading Program',
    description: 'Comprehensive microblading program teaching hair-stroke techniques, facial mapping, and permanent makeup fundamentals.'
  },
  {
    name: 'Up-do Hairstyling',
    description: 'Professional hairstyling program focusing on formal updos, bridal styles, and contemporary hair design techniques.'
  }
];

async function updateDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const program of programDescriptions) {
      const result = await Program.findOneAndUpdate(
        { name: program.name },
        { $set: { description: program.description } },
        { new: true }
      );

      if (result) {
        console.log('\nUpdated', program.name + ':');
        console.log('-------------------');
        console.log('Name:', result.name);
        console.log('Description:', result.description);
        console.log('Duration:', result.durationValue, result.durationUnit);
        console.log('Modes:', result.instructionModes.join(', '));
        console.log('-------------------');
      } else {
        console.log('\nProgram not found:', program.name);
      }
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

updateDescriptions(); 