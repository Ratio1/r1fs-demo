import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  InvalidPasswordError,
  InvalidUserRoleError,
  InvalidUsernameError,
  UserExistsError,
  UserNotFoundError,
  InvalidCredentialsError,
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
  maxAllowedFiles?: unknown;
};

type BasicUser = PublicUser<Record<string, unknown>>;

type CreateUserResponse = {
  success: boolean;
  user?: Pick<BasicUser, 'username' | 'role' | 'metadata' | 'createdAt' | 'updatedAt'>;
  error?: string;
};

type ListUsersResponse = {
  success: boolean;
  users?: Pick<BasicUser, 'username' | 'role' | 'metadata' | 'createdAt' | 'updatedAt'>[];
  error?: string;
};

type UpdateUserPayload = {
  username?: unknown;
  role?: unknown;
  metadata?: unknown;
  maxAllowedFiles?: unknown;
};

type UpdateUserResponse = {
  success: boolean;
  user?: Pick<BasicUser, 'username' | 'role' | 'metadata' | 'createdAt' | 'updatedAt'>;
  error?: string;
};

type ChangePasswordPayload = {
  username?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
};

type ChangePasswordResponse = {
  success: boolean;
  error?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(config.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);

  if (!session || session.username !== 'admin') {
    return NextResponse.json<ListUsersResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const client = getAuthClient();

  try {
    await ensureAuthInitialized(client);

    // Use the official getAllUsers() method from SDK v0.4.0+
    const allUsers = await client.simple.getAllUsers();

    const users: Pick<BasicUser, 'username' | 'role' | 'metadata' | 'createdAt' | 'updatedAt'>[] = allUsers.map(user => ({
      username: user.username,
      role: user.role,
      metadata: user.metadata || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // Sort users by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json<ListUsersResponse>(
      {
        success: true,
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[users] Failed to list users', error);

    return NextResponse.json<ListUsersResponse>(
      { success: false, error: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
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

  const { username, password, role, metadata, maxAllowedFiles } = payload;

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

  const metadataCandidate = isPlainObject(metadata) ? metadata : undefined;
  const rawMaxAllowed =
    maxAllowedFiles !== undefined
      ? maxAllowedFiles
      : metadataCandidate?.maxAllowedFiles;

  let metadataValue: { maxAllowedFiles: number } | undefined;

  if (rawMaxAllowed !== undefined) {
    const parsed =
      typeof rawMaxAllowed === 'number' ? rawMaxAllowed : Number(rawMaxAllowed);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: 'Max allowed files must be a positive number' },
        { status: 400 }
      );
    }

    metadataValue = { maxAllowedFiles: Math.floor(parsed) };
  }

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

// PATCH /api/users - Update user (role, metadata)
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(config.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);

  if (!session || session.username !== 'admin') {
    return NextResponse.json<UpdateUserResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  let payload: UpdateUserPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<UpdateUserResponse>(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { username, role, metadata, maxAllowedFiles } = payload;

  if (typeof username !== 'string') {
    return NextResponse.json<UpdateUserResponse>(
      { success: false, error: 'Username is required' },
      { status: 400 }
    );
  }

  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return NextResponse.json<UpdateUserResponse>(
      { success: false, error: 'Username cannot be empty' },
      { status: 400 }
    );
  }

  let desiredRole: 'admin' | 'user' | undefined;
  if (role !== undefined) {
    if (role === 'admin' || role === 'user') {
      desiredRole = role;
    } else {
      return NextResponse.json<UpdateUserResponse>(
        { success: false, error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }
  }

  const metadataCandidate = isPlainObject(metadata) ? metadata : undefined;
  const rawMaxAllowed =
    maxAllowedFiles !== undefined
      ? maxAllowedFiles
      : metadataCandidate?.maxAllowedFiles;

  let metadataValue: { maxAllowedFiles: number } | undefined;

  if (rawMaxAllowed !== undefined) {
    const parsed =
      typeof rawMaxAllowed === 'number' ? rawMaxAllowed : Number(rawMaxAllowed);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json<UpdateUserResponse>(
        { success: false, error: 'Max allowed files must be a positive number' },
        { status: 400 }
      );
    }

    metadataValue = { maxAllowedFiles: Math.floor(parsed) };
  }

  const client = getAuthClient();

  try {
    await ensureAuthInitialized(client);

    const updatedUser = await client.simple.updateUser(trimmedUsername, {
      ...(desiredRole ? { role: desiredRole } : {}),
      ...(metadataValue ? { metadata: metadataValue } : {}),
    });

    return NextResponse.json<UpdateUserResponse>(
      {
        success: true,
        user: {
          username: updatedUser.username,
          role: updatedUser.role,
          metadata: updatedUser.metadata,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof InvalidUsernameError ||
      error instanceof InvalidUserRoleError
    ) {
      return NextResponse.json<UpdateUserResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof UserNotFoundError) {
      return NextResponse.json<UpdateUserResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.error('[users] Failed to update user', error);

    return NextResponse.json<UpdateUserResponse>(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Change password
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(config.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);

  if (!session) {
    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let payload: ChangePasswordPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { username, currentPassword, newPassword } = payload;

  if (
    typeof username !== 'string' ||
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string'
  ) {
    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Username, current password, and new password are required' },
      { status: 400 }
    );
  }

  const trimmedUsername = username.trim();
  const trimmedCurrentPassword = currentPassword.trim();
  const trimmedNewPassword = newPassword.trim();

  if (!trimmedUsername || !trimmedCurrentPassword || !trimmedNewPassword) {
    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Username and passwords cannot be empty' },
      { status: 400 }
    );
  }

  // Users can only change their own password, admins can change any password
  if (session.username !== 'admin' && session.username !== trimmedUsername) {
    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const client = getAuthClient();

  try {
    await ensureAuthInitialized(client);

    await client.simple.changePassword(
      trimmedUsername,
      trimmedCurrentPassword,
      trimmedNewPassword
    );

    return NextResponse.json<ChangePasswordResponse>(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof InvalidPasswordError) {
      return NextResponse.json<ChangePasswordResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json<ChangePasswordResponse>(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    if (error instanceof UserNotFoundError) {
      return NextResponse.json<ChangePasswordResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.error('[users] Failed to change password', error);

    return NextResponse.json<ChangePasswordResponse>(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
