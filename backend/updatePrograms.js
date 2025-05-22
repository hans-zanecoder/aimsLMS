require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

const programUpdates = [
  {
    name: 'Up-do Hairstyling',
    update: {
      durationValue: '24',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Online']
    }
  },
  {
    name: 'Microshading Program',
    update: {
      durationValue: '24',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Hybrid']
    }
  },
  {
    name: 'Microblading Program',
    update: {
      durationValue: '24',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Hybrid']
    }
  },
  {
    name: 'Professional Makeup Artistry',
    update: {
      description: 'Professional makeup artistry program covering beauty, bridal, editorial, and special effects makeup.',
      durationValue: '56',
      durationUnit: 'hours',
      instructionModes: ['Online']
    }
  },
  {
    name: 'Intro to Makeup Artistry',
    update: {
      durationValue: '28',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Online']
    }
  },
  {
    name: 'Eyelash Extensions',
    update: {
      description: 'Specialized program covering classic, volume, and hybrid eyelash extension techniques.',
      durationValue: '24',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Online']
    }
  },
  {
    name: 'Cosmetology',
    update: {
      description: 'Complete cosmetology program covering hair, skin, and nail care, along with business skills.',
      durationValue: '1000',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Hybrid']
    }
  },
  {
    name: 'Esthetician',
    update: {
      description: 'Comprehensive esthetics program covering skincare fundamentals, advanced treatments, and client management.',
      durationValue: '600',
      durationUnit: 'hours',
      instructionModes: ['In-Person', 'Hybrid']
    }
  }
];

async function updatePrograms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update each program
    for (const { name, update } of programUpdates) {
      const result = await Program.findOneAndUpdate(
        { name },
        { $set: update },
        { new: true, upsert: true }
      );
      
      console.log(`\nUpdated ${name}:`);
      console.log('- Description:', result.description);
      console.log('- Duration:', result.durationValue, result.durationUnit);
      console.log('- Instruction Modes:', result.instructionModes);
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
updatePrograms(); 