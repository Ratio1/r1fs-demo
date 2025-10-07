import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';
import { createSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  let credentials: unknown;

  try {
    credentials = await request.json();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  if (!credentials || typeof credentials !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Missing credentials' },
      { status: 400 }
    );
  }

  const { username, password } = credentials as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const result = await authService.login({ username, password });

  if (!result.success || !result.user) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true, user: result.user });

  const sessionCookie = createSessionCookie(result.user.username);
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return response;
}

export const runtime = 'nodejs';
