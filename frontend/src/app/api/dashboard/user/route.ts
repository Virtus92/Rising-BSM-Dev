import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

export async function GET(req: NextRequest) {
  // In a real app, this would validate the JWT token and return the user data
  // For now, we'll return mock data for testing
  
  // Check if we have an Authorization header
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unauthorized',
        data: null
      }, 
      { status: 401 }
    );
  }
  
  // Mock user data - in a real app, this would be fetched from a database
  const userData = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    phone: '+43 123 456789',
    profilePicture: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  return NextResponse.json(
    { 
      success: true, 
      data: userData
    }, 
    { status: 200 }
  );
}
