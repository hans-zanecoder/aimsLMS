require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');

async function updateIntroMakeup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Program.findOneAndUpdate(
      { name: 'Intro to Makeup Artistry' },
      { 
        $set: { 
          description: 'Foundational makeup artistry program covering basic techniques, color theory, and professional application methods.'
        } 
      },
      { new: true }
    );

    if (result) {
      console.log('\nUpdated Intro to Makeup Artistry:');
      console.log('-------------------');
      console.log('Name:', result.name);
      console.log('Description:', result.description);
      console.log('Duration:', result.durationValue, result.durationUnit);
      console.log('Modes:', result.instructionModes.join(', '));
      console.log('-------------------');
    } else {
      console.log('Program not found');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

updateIntroMakeup(); 