require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Program = require('./src/models/Program');

// Map input program names to actual database program names
const programNameMap = {
  'Intro Makeup': 'Intro to Makeup Artistry',
  'Pro Makeup': 'Professional Makeup Artistry',
  'Microshading': 'Microshading Program',
  'Microblading': 'Microblading Program'
};

const students = [
  { name: 'Adriana Ruiz Rodriguez', program: 'Intro Makeup', email: '3236957903a@gmail.com' },
  { name: 'Alejandra Garcia Preciado', program: 'Intro Makeup', email: 'pgarciaalejandra81@gmail.com' },
  { name: 'Alma D Oropeza', program: 'Intro Makeup', email: 'almaoropeza15@gmail.com' },
  { name: 'Anayeli Palma', program: 'Microshading', email: 'palma.anayeli1629@gmail.com' },
  { name: 'Arely Delgado', program: 'Intro Makeup', email: 'darely94@yahoo.com' },
  { name: 'Carmen J Velez', program: 'Intro Makeup', email: 'rv2940590@gmail.com' },
  { name: 'Cesiah Valero', program: 'Pro Makeup', email: 'cesiavalero17@gmail.com' },
  { name: 'Delgadina Rubio Sanchez', program: 'Intro Makeup', email: 'keylirubios92@icloud.com' },
  { name: 'Doris Lopez', program: 'Intro Makeup', email: 'Dorislopez206@gmail.com' },
  { name: 'Elinor Organista', program: 'Intro Makeup', email: 'organistaelinor714@yahoo.com' },
  { name: 'Elizabeth Zarate de Isusquiza', program: 'Microblading', email: 'elizabethzarate1969@gmail.com' },
  { name: 'Elvira Gonzalez', program: 'Intro Makeup', email: 'elviragozalez119@gmail.com' },
  { name: 'Eydolet E Hernandez', program: 'Intro Makeup', email: 'Eydolet_15@hotmail.com' },
  { name: 'Geisel Cervantes Diaz', program: 'Microblading', email: 'geiselcervantes8@gmail.com' },
  { name: 'Hania T. Perez Cifuentes', program: 'Microblading', email: 'haniatanae@gmail.com' },
  { name: 'Karla Q Valladares', program: 'Intro Makeup', email: 'karla21valladares@gmail.com' },
  { name: 'Laura E Quebrado', program: 'Microshading', email: 'lauraquebrado861@gmail.com' },
  { name: 'Luz Perez', program: 'Pro Makeup', email: 'bautista.luz63@gmail.com' },
  { name: 'Maria Carmen Salazar', program: 'Intro Makeup', email: 'carmensalazar1323@gmail.com' },
  { name: 'Maria García (ventura)', program: 'Intro Makeup', email: 'Mngarciaangel@gmail.com' },
  { name: 'Maria L Merino', program: 'Intro Makeup', email: 'luisaperalta57@gmail.com' },
  { name: 'Mariela Duran', program: 'Intro Makeup', email: 'marielajose27.92@gmail.com' },
  { name: 'Mariela Hernandez', program: 'Intro Makeup', email: 'marielahernandez984@gmail.com' },
  { name: 'Ofelia Gonzalez', program: 'Intro Makeup', email: 'ophidiaz13@gmail.com' },
  { name: 'Perla Baltazar', program: 'Pro Makeup', email: 'perlabaltazar1030@gmail.com' },
  { name: 'Rosa M Martinez', program: 'Intro Makeup', email: 'rosapadron1983@gmail.com' },
  { name: 'Rosa Ramirez', program: 'Intro Makeup', email: 'rosaram199408@gmail.com' },
  { name: 'Ruth Villalobos', program: 'Pro Makeup', email: '' },
  { name: 'Sandra Mora Benitz', program: 'Intro Makeup', email: 'gore.mediss@gmail.com' },
  { name: 'Silvia D Jovel', program: 'Microshading', email: 'sjovel658@gmail.com' }
];

async function addStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all programs
    const programs = await Program.find();
    const programMap = {};
    programs.forEach(program => {
      programMap[program.name] = program._id;
    });

    console.log('Found programs:', Object.keys(programMap));

    let addedCount = 0;
    let skippedCount = 0;
    
    for (const student of students) {
      // Skip students with empty email
      if (!student.email) {
        console.log(`Skipping ${student.name} - No email provided`);
        skippedCount++;
        continue;
      }
      
      // Check if student already exists
      const existingUser = await User.findOne({ email: student.email.toLowerCase() });
      if (existingUser) {
        console.log(`User ${student.email} already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Split name into first and last name
      const nameParts = student.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Create user
      const user = await User.create({
        email: student.email.toLowerCase(),
        password: 'Student123', // Default password
        role: 'student',
        firstName,
        lastName
      });

      // Map the input program name to the actual database program name
      const mappedProgramName = programNameMap[student.program] || student.program;
      
      // Find program ID
      const programId = programMap[mappedProgramName];
      if (!programId) {
        console.log(`Program ${mappedProgramName} (from ${student.program}) not found for ${student.name}`);
        skippedCount++;
        continue;
      }

      // Create student record
      await Student.create({
        userId: user._id,
        status: 'Active',
        enrollmentDate: new Date(),
        coursesEnrolled: []
      });

      console.log(`Added student: ${student.name} (${student.email}) to ${mappedProgramName}`);
      addedCount++;
    }

    console.log(`\nCompleted: Added ${addedCount} students, skipped ${skippedCount} students`);
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

addStudents(); 