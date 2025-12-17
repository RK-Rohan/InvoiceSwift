import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/auth/user-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 });
    }

    const user = await createUser(email, password);
    return NextResponse.json(
      { user: { id: user._id.toString(), email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
  }
}
