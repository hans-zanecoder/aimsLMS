# AIMA Learning Management System Documentation

## 1. Project Overview
AIMA LMS is a modern learning management system built with Next.js (frontend) and Node.js/Express (backend). The system features a responsive design, dark/light theme support, and role-based authentication.

## 2. Technical Stack

### Frontend
- Framework: Next.js 13+ (App Router)
- Language: TypeScript
- Styling: CSS Modules + Tailwind CSS
- Icons: Lucide React
- State Management: React Context

### Backend
- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB (with Mongoose)
- Authentication: JWT (stored in HTTP-only cookies)

## 3. Core Features

### Authentication System
- JWT-based authentication
- Secure cookie handling
- Role-based access control (Admin, Instructor, Student)
- Session persistence
- Automatic token refresh

### Theme System
- Dark/Light mode support
- System preference detection
- Theme persistence in localStorage
- Smooth theme transitions

### Admin Dashboard
1. **Navigation**
   - Responsive sidebar
   - Mobile-friendly hamburger menu
   - Dynamic section switching

2. **Top Bar**
   - Search functionality
   - Theme toggle
   - Notifications system
   - User menu dropdown

3. **Dashboard Overview**
   - Welcome section
   - Statistics cards
   - Recent students list
   - System status indicators

4. **Students Management**
   - Student listing table
   - Search and filtering
   - Status indicators
   - Progress tracking
   - Action buttons (Edit, Email, View, Delete)

5. **Profile Management**
   - User information display
   - Editable fields
   - Form validation
   - Real-time updates

## 4. File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin dashboard
│   │   │   ├── admin.module.css   # Dashboard styles
│   │   │   └── profile/
│   │   │       ├── page.tsx       # Profile page
│   │   │       └── profile.module.css
│   │   ├── login/
│   │   │   ├── page.tsx          # Login page
│   │   │   └── login.module.css
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   └── contexts/
│       ├── AuthContext.tsx       # Authentication context
│       └── ThemeContext.tsx      # Theme context
├── public/
│   ├── google.svg
│   └── facebook.svg
└── next.config.js

backend/
├── src/
│   ├── routes/
│   │   └── auth.js               # Authentication routes
│   ├── models/
│   │   └── User.js              # User model
│   └── middleware/
│       └── auth.js              # Auth middleware
```

## 5. API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/profile
```

## 6. Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  department?: string;
  joinDate?: string;
}
```

## 7. Styling System

### Theme Variables
```css
:root {
  --background: #ffffff;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  /* ... other variables */
}

[data-theme='dark'] {
  --background: #111827;
  --card-bg: #1f2937;
  --border-color: rgba(255, 255, 255, 0.1);
  /* ... other dark theme variables */
}
```

## 8. Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (max-width: 768px) { ... }

/* Small Desktop */
@media (max-width: 1024px) { ... }
```

## 9. Current Status
- ✅ Authentication system
- ✅ Admin dashboard layout
- ✅ Theme system
- ✅ Profile management
- ✅ Students listing
- ✅ Responsive design
- ✅ Basic API integration

## 10. Next Steps
1. Implement remaining dashboard sections:
   - Courses management
   - Analytics
   - Permissions
   - Settings
2. Add student enrollment system
3. Implement course creation and management
4. Add file upload functionality
5. Implement real-time notifications
6. Add data visualization for analytics
7. Implement student progress tracking
8. Add course content management

## 11. Component Details

### AuthContext
The authentication context manages user state and provides authentication-related functionality:
- Login/Logout handling
- User session management
- Profile updates
- Error handling

### ThemeContext
Manages the application's theme state:
- Theme switching
- System preference detection
- Theme persistence
- Icon switching based on theme

### Admin Dashboard
The main dashboard component includes:
- Dynamic section rendering
- State management for active sections
- Responsive layout handling
- Data visualization
- User interaction handling

### Profile Management
The profile section includes:
- Form state management
- Real-time validation
- API integration
- Error handling
- Loading states

## 12. Styling Architecture

### CSS Modules
Each component has its own CSS module for scoped styling:
- `admin.module.css` - Dashboard styles
- `profile.module.css` - Profile page styles
- `login.module.css` - Login page styles

### Global Styles
The `globals.css` file contains:
- Base styles
- Theme variables
- Utility classes
- Animation definitions

### Responsive Design
The application follows a mobile-first approach with breakpoints at:
- 640px for mobile devices
- 768px for tablets
- 1024px for small desktops
- 1280px for large desktops

## 13. Authentication Flow

1. **Login Process**
   ```
   User Input → Validation → API Request → JWT Generation → Cookie Storage → Redirect
   ```

2. **Session Management**
   ```
   Page Load → Token Check → API Verification → Session Restore/Redirect
   ```

3. **Profile Updates**
   ```
   Form Input → Validation → API Request → State Update → UI Refresh
   ```

## 14. Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper error handling
- Use async/await for promises
- Maintain consistent naming conventions

### Component Structure
- Separate business logic from UI
- Use custom hooks for reusable logic
- Implement proper prop typing
- Follow single responsibility principle

### State Management
- Use Context for global state
- Local state for component-specific data
- Implement proper state initialization
- Handle loading and error states

### API Integration
- Centralize API calls
- Implement proper error handling
- Use type-safe request/response handling
- Maintain consistent error formats

## 15. Security Measures

1. **Authentication**
   - JWT stored in HTTP-only cookies
   - CSRF protection
   - Rate limiting
   - Session management

2. **Data Protection**
   - Input validation
   - XSS prevention
   - CORS configuration
   - Secure password handling

3. **Authorization**
   - Role-based access control
   - Route protection
   - API endpoint security
   - Resource access control

## 16. Performance Optimization

1. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size optimization

2. **Backend**
   - Query optimization
   - Caching strategies
   - Response compression
   - Connection pooling

## 17. Testing Strategy

1. **Unit Tests**
   - Component testing
   - Hook testing
   - Utility function testing
   - API integration testing

2. **Integration Tests**
   - Route testing
   - Authentication flow
   - User interactions
   - State management

3. **E2E Tests**
   - User flows
   - Critical paths
   - Cross-browser testing
   - Mobile responsiveness

## 18. Deployment

1. **Frontend**
   - Vercel deployment
   - Environment configuration
   - Build optimization
   - CDN configuration

2. **Backend**
   - Server setup
   - Database configuration
   - Environment variables
   - Monitoring setup

## 19. Maintenance

1. **Regular Tasks**
   - Dependency updates
   - Security patches
   - Performance monitoring
   - Error tracking

2. **Documentation**
   - Code documentation
   - API documentation
   - Component documentation
   - Setup instructions

## 20. Future Enhancements

1. **Feature Additions**
   - Real-time chat
   - Video conferencing
   - Content management
   - Assessment system

2. **Technical Improvements**
   - GraphQL integration
   - Microservices architecture
   - WebSocket implementation
   - PWA support 