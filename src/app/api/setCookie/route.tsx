import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptText } from '@/lib/encrtption';

export async function POST(request: Request) {
  try {
    const { hashedUserId } = await request.json();

    if (!hashedUserId) {
      return NextResponse.json(
        { error: 'Hashed user ID is required' },
        { status: 400 }
      );
    }

    // Set the cookie with appropriate security settings
    (await cookies()).set('auth_token', hashedUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json(
      { success: true, message: 'Cookie set successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set cookie' },
      { status: 500 }
    );
  }
}