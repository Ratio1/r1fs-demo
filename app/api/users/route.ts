import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  InvalidPasswordError,
  InvalidUserRoleError,
  InvalidUsernameError,
  UserExistsError,
  type PublicUser,
} from '@ratio1/cstore-auth-ts';
import { ensureAuthInitialized, getAuthClient } from '@/lib/auth/cstore';
import { readSessionFromCookie } from '@/lib/auth/session';
import { config } from '@/lib/config';

type CreateUserPayload = {
  username?: unknown;
  password?: unknown;
  role?: unknown;
  metadata?: unknown;
};

type BasicUser = PublicUser<Record<string, unknown>>;

type CreateUserResponse = {
  success: boolean;
  user?: Pick<BasicUser, 'username' | 'role' | 'metadata' | 'createdAt' | 'updatedAt'>;
  error?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const sessionCookieValue = cookieStore.get(config.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);

  if (!session || session.username !== 'admin') {
    return NextResponse.json<CreateUserResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  let payload: CreateUserPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<CreateUserResponse>(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { username, password, role, metadata } = payload;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json<CreateUserResponse>(
      { success: false, error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || !trimmedPassword) {
    return NextResponse.json<CreateUserResponse>(
      { success: false, error: 'Username and password cannot be empty' },
      { status: 400 }
    );
  }

  let desiredRole: 'admin' | 'user' | undefined;
  if (role !== undefined) {
    if (role === 'admin' || role === 'user') {
      desiredRole = role;
    } else {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }
  }

  const metadataValue = isPlainObject(metadata) ? metadata : undefined;

  const client = getAuthClient();

  try {
    await ensureAuthInitialized(client);

    const createdUser = await client.simple.createUser(trimmedUsername, trimmedPassword, {
      ...(desiredRole ? { role: desiredRole } : {}),
      ...(metadataValue ? { metadata: metadataValue } : {}),
    });

    return NextResponse.json<CreateUserResponse>(
      {
        success: true,
        user: {
          username: createdUser.username,
          role: createdUser.role,
          metadata: createdUser.metadata,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof InvalidUsernameError ||
      error instanceof InvalidPasswordError ||
      error instanceof InvalidUserRoleError
    ) {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof UserExistsError) {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    console.error('[users] Failed to create user', error);

    return NextResponse.json<CreateUserResponse>(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
