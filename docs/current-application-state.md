# AIMA LMS - Current Application State (March 4, 2025)

## Application Overview

AIMA LMS (Learning Management System) is a comprehensive platform designed for educational institutions to manage students, courses, and the learning process. The application follows a modern architecture with a React/Next.js frontend and a Node.js/Express backend.

## Architecture

### Frontend
- **Framework**: Next.js with React 18
- **Styling**: CSS Modules
- **State Management**: React Context and Hooks
- **Icons**: Lucide React
- **Directory Structure**:
  - `/src/app`: Next.js app router pages
  - `/src/components`: Reusable UI components
  - `/src/contexts`: React context providers
  - `/src/utils`: Utility functions including API client
  - `/src/types`: TypeScript type definitions

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with refresh tokens
- **Validation**: Joi for request validation
- **Directory Structure**:
  - `/src/routes`: API route handlers
  - `/src/models`: Mongoose data models
  - `/src/middleware`: Express middleware
  - `/src/utils`: Utility functions

## Key Features

### Student Management
- Create, read, update, and delete student records
- Student identity information (name, email) with protected editing
- Contact information management
- Address handling with validation
- Campus and practical location assignment
- Status tracking (Active, Pending, Inactive)

### Course Management
- Course creation and editing
- Course categorization
- Instructor assignment
- Module-based course structure
- Course enrollment tracking

### User System
- Role-based access control (admin, instructor, student)
- Authentication with JWT
- Profile management
- Password reset functionality

## Data Models

### User
- Basic identity information (firstName, lastName, email)
- Authentication details (password, role)
- Contact information (phone, location, department)

### Student
- References User model (userId)
- Enrollment information (enrollmentDate, coursesEnrolled)
- Status and progress tracking
- Campus and location details

### Course
- Title, description, category
- Instructor reference
- Modules and content structure
- Status and availability

## Current Components

### StudentForm Component
The StudentForm component is a comprehensive dialog for creating and editing student records. It includes:

#### UI Structure
- Modal overlay with header and close button
- Tab navigation between "Basic Info" and "Enrollment" sections
- Form with various input fields organized by section
- Error display with auto-dismissal
- Identity field editing with confirmation dialog
- Responsive design for mobile and desktop

#### Features
- Form validation for required fields and format validation
- Address parsing and formatting
- Campus selection with conditional fields
- Course enrollment management
- Special handling for identity field editing
- Confirmation dialog for sensitive operations

#### State Management
- Form data tracking with controlled inputs
- Tab navigation state
- Error handling and display
- Loading state during API operations
- Identity field editing permissions

#### Recent Fixes
- Fixed name update functionality in the backend
- Removed duplicate identity editing controls
- Added confirmation dialog for identity editing
- Fixed component structure and syntax errors

## API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout
- `GET /api/auth/me`: Get current user
- `PUT /api/auth/profile`: Update user profile
- `POST /api/auth/refresh`: Refresh authentication token

### Students
- `GET /api/students`: Get all students (admin only)
- `GET /api/students/:id`: Get single student details
- `POST /api/students`: Create new student
- `PUT /api/students/:id`: Update student
- `DELETE /api/students/:id`: Delete student
- `POST /api/students/:id/enroll`: Enroll student in course

### Courses
- `GET /api/courses`: Get all courses with optional filtering
- `GET /api/courses/:id`: Get course details
- `POST /api/courses`: Create new course
- `PUT /api/courses/:id`: Update course
- `DELETE /api/courses/:id`: Delete course
- `POST /api/courses/:id/modules`: Add module to course

## Current Validation Rules

### Student Creation
- Required fields: email, firstName, lastName (when creating new user)
- Optional fields: phone, location, department, status, enrollmentDate
- Status must be one of: 'Active', 'Pending', 'Inactive'

### Student Update
- At least one field must be provided
- firstName and lastName can be updated
- Status must be one of: 'Active', 'Pending', 'Inactive'
- phone, location, department are optional

## UI/UX Considerations

### Form Design
- Clear section organization with icons
- Inline validation with error messages
- Responsive layout for different screen sizes
- Sticky tab navigation
- Floating save button on mobile
- Confirmation dialogs for sensitive operations

### Error Handling
- Prominent error container
- Auto-dismissal of error messages (5-second timeout)
- Manual error dismissal option
- Field-level validation indicators

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Proper ARIA labels
- Focus management

## Known Limitations and Future Improvements

### Current Limitations
- Relies primarily on client-side validation
- Some edge cases in address parsing might need refinement
- Limited bulk operations for students and courses

### Planned Improvements
- Enhanced client-side validation
- More granular error handling
- Performance optimization
- Enhanced accessibility features
- Expanded reporting capabilities

## Development Workflow

### Local Development
- Frontend: `npm run dev` in the frontend directory
- Backend: `npm run dev` in the backend directory
- Both use hot reloading for development

### API Testing
- API endpoints can be tested using the browser console or tools like Postman
- Backend includes logging for debugging API calls

### Version Control
- The project is hosted on GitHub at https://github.com/sandhanwalia/aimaLMS
- Main branch contains the latest stable version
- Follow standard Git workflow for contributions:
  - Create feature branches for new work
  - Submit pull requests for review
  - Merge to main after approval

## Deployment Considerations

### Environment Variables
- Frontend: API URL configuration
- Backend: Database connection, JWT secrets, environment mode

### Build Process
- Frontend: Next.js build and export
- Backend: Node.js deployment

## Conclusion

The AIMA LMS application is a robust platform for educational management with a focus on student and course administration. Recent improvements have enhanced the user experience and data integrity, particularly in the student management area. The application follows modern web development practices with a clear separation of concerns between frontend and backend components.
