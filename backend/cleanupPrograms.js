require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

// Define exact programs as shown in screenshot, in the exact order
const correctPrograms = [
  {
    name: 'Esthetician',
    description: 'Comprehensive esthetics program covering skincare fundamentals, advanced treatments, and client management.',
    durationValue: '600',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Hybrid']
  },
  {
    name: 'Cosmetology',
    description: 'Complete cosmetology program covering hair, skin, and nail care, along with business skills.',
    durationValue: '1000',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Hybrid']
  },
  {
    name: 'Eyelash Extensions',
    description: 'Specialized program covering classic, volume, and hybrid eyelash extension techniques.',
    durationValue: '24',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Online']
  },
  {
    name: 'Intro to Makeup Artistry',
    description: '',  // Empty in screenshot
    durationValue: '28',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Online']
  },
  {
    name: 'Professional Makeup Artistry',
    description: 'Professional makeup artistry program covering beauty, bridal, editorial, and special effects makeup.',
    durationValue: '56',
    durationUnit: 'hours',
    instructionModes: ['Online']
  },
  {
    name: 'Microblading Program',
    description: '',  // Empty in screenshot
    durationValue: '24',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Hybrid']
  },
  {
    name: 'Microshading Program',
    description: '',  // Empty in screenshot
    durationValue: '24',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Hybrid']
  },
  {
    name: 'Up-do Hairstyling',
    description: '',  // Empty in screenshot
    durationValue: '24',
    durationUnit: 'hours',
    instructionModes: ['In-Person', 'Online']
  }
];

async function cleanupPrograms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, remove all existing programs
    await Program.deleteMany({});
    console.log('Cleared existing programs');

    // Insert all programs in the exact order
    for (const program of correctPrograms) {
      await Program.create(program);
      console.log(`Created: ${program.name}`);
    }

    // Verify the programs
    const results = await Program.find({}).sort({ createdAt: 1 });
    
    console.log('\nVerifying programs in order:');
    results.forEach(program => {
      console.log(`\n${program.name}:`);
      console.log('- Description:', program.description || '(empty)');
      console.log('- Duration:', program.durationValue, program.durationUnit);
      console.log('- Instruction Modes:', program.instructionModes);
    });

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

// Run the function
cleanupPrograms(); 