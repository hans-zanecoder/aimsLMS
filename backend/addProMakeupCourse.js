require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./src/models/Program');
const Course = require('./src/models/Course');
const Instructor = require('./src/models/Instructor');
const User = require('./src/models/User');

async function addCourse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find the Professional Makeup Artistry program
    const program = await Program.findOne({ name: 'Professional Makeup Artistry' });
    if (!program) {
      console.error('Professional Makeup Artistry program not found');
      await mongoose.connection.close();
      return;
    }
    console.log('Found program:', program.name, `(${program._id})`);

    // 2. Find or create the instructor
    let instructor = await Instructor.findOne({ 
      firstName: 'Alina',
      lastName: 'Santiago'
    });

    if (!instructor) {
      console.log('Instructor not found, creating new instructor...');
      
      // Create a user for the instructor first
      const user = await User.create({
        firstName: 'Alina',
        lastName: 'Santiago',
        email: 'alina.santiago@example.com',
        password: 'Instructor123',
        role: 'instructor'
      });
      
      // Then create the instructor
      instructor = await Instructor.create({
        firstName: 'Alina',
        lastName: 'Santiago',
        email: 'alina.santiago@example.com',
        phone: '',
        startDate: '2024-01',
        programs: [program._id]
      });
      
      console.log('Created new instructor:', `${instructor.firstName} ${instructor.lastName}`);
    } else {
      console.log('Found existing instructor:', `${instructor.firstName} ${instructor.lastName}`);
    }

    // 3. Calculate course dates and details
    const startDate = new Date('2025-01-11');
    const endDate = new Date('2025-04-26');
    
    // Calculate total course duration in minutes (14 weeks * 4 hours * 60 minutes)
    const totalDuration = 14 * 4 * 60;

    // 4. Create the course
    const course = await Course.create({
      title: 'Professional Makeup Artistry - Santa Ana Campus',
      description: 'Professional makeup artistry program covering beauty, bridal, editorial, and special effects makeup. Classes held at the Santa Ana campus.',
      instructorId: instructor._id,
      category: program.name,
      duration: totalDuration,
      status: 'Published',
      level: 'All Levels',
      prerequisites: [],
      learningObjectives: [
        'Master professional makeup techniques',
        'Learn color theory and skin tone matching',
        'Develop skills in beauty, bridal, and special effects makeup',
        'Create a professional makeup portfolio'
      ],
      tags: ['makeup', 'professional', 'beauty', 'bridal', 'special effects'],
      price: 0,
      isFeatured: true,
      // Additional fields for schedule
      startDate: startDate,
      endDate: endDate,
      classDays: ['Saturday'],
      classStartTime: '10:00 AM',
      classEndTime: '2:00 PM',
      modules: [
        {
          title: 'Introduction to Professional Makeup',
          description: 'Overview of professional makeup artistry and essential tools',
          lessons: []
        },
        {
          title: 'Color Theory and Face Shapes',
          description: 'Understanding color harmony and adapting techniques to different face shapes',
          lessons: []
        },
        {
          title: 'Foundation and Concealing Techniques',
          description: 'Professional application methods for flawless skin',
          lessons: []
        },
        {
          title: 'Eye Makeup and Lash Application',
          description: 'Creating dramatic and subtle eye looks with various techniques',
          lessons: []
        },
        {
          title: 'Bridal and Special Event Makeup',
          description: 'Long-lasting makeup techniques for special occasions',
          lessons: []
        },
        {
          title: 'Special Effects and Editorial Makeup',
          description: 'Creative techniques for fashion and film applications',
          lessons: []
        }
      ]
    });

    console.log('Successfully created course:');
    console.log('Title:', course.title);
    console.log('Instructor:', `${instructor.firstName} ${instructor.lastName}`);
    console.log('Schedule: Saturdays 10AM-2PM, Jan 11 - Apr 26, 2025');
    console.log('Total weeks:', 14);
    console.log('Hours per week:', 4);
    console.log('Course ID:', course._id);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

addCourse(); 