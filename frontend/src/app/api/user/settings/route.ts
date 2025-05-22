import { NextResponse } from 'next/server';

// Temporary mock user data for development
const mockUser = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  phone: '',
  department: 'Administration',
  bio: ''
};

export async function GET() {
  try {
    // For now, we'll always return the mock admin user
    return NextResponse.json(mockUser);
  } catch (error) {
    console.error('[USER_SETTINGS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, department, bio } = body;

    // For now, we'll just log the update and return success
    console.log('Updating user settings:', { firstName, lastName, phone, department, bio });
    
    return NextResponse.json({
      ...mockUser,
      firstName,
      lastName,
      phone,
      department,
      bio
    });
  } catch (error) {
    console.error('[USER_SETTINGS_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 