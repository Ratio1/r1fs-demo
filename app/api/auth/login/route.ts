import { NextResponse } from 'next/server';
import { CStoreAuth, InvalidCredentialsError, resolveAuthEnv } from '@ratio1/cstore-auth-ts';
import type { PublicUser } from '@ratio1/cstore-auth-ts';
import { createSessionCookie } from '@/lib/auth/session';
import { config } from '@/lib/config';

type AuthenticatedUser = PublicUser<Record<string, unknown>>;

type LoginFailureReason = 'invalid-input' | 'invalid-credentials';

type LoginSuccess = {
  success: true;
  user: AuthenticatedUser;
};

type LoginFailure = {
  success: false;
  error?: string;
  reason?: LoginFailureReason;
};

type LoginResult = LoginSuccess | LoginFailure;

const AUTH_OVERRIDES: Partial<Record<'hkey' | 'secret', string>> = {};
if (config.auth.cstore.hkey) {
  AUTH_OVERRIDES.hkey = config.auth.cstore.hkey;
}
if (config.auth.cstore.secret) {
  AUTH_OVERRIDES.secret = config.auth.cstore.secret;
}

let authClient: CStoreAuth | null = null;
let authInitPromise: Promise<void> | null = null;

function getAuthClient(): CStoreAuth {
  if (!authClient) {
    const resolved = resolveAuthEnv(AUTH_OVERRIDES, process.env);

    authClient = new CStoreAuth({
      hkey: resolved.hkey,
      secret: resolved.secret,
      logger: console,
    });
  }

  return authClient;
}

async function ensureAuthInitialized(client: CStoreAuth): Promise<void> {
  if (!authInitPromise) {
    authInitPromise = client.simple.init().catch((error) => {
      authInitPromise = null;
      throw error;
    });
  }

  await authInitPromise;
}

async function login(username: string, password: string): Promise<LoginResult> {
  if (!username || !password) {
    return { success: false, reason: 'invalid-input', error: 'Missing credentials' };
  }

  const client = getAuthClient();

  await ensureAuthInitialized(client);

  try {
    const user = await client.simple.authenticate(username, password);
    return { success: true, user };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return { success: false, reason: 'invalid-credentials', error: 'Invalid credentials' };
    }

    throw error;
  }
}

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

  try {
    const result = await login(username, password);

    if (!result.success) {
      const status =
        result.reason === 'invalid-input'
          ? 400
          : result.reason === 'invalid-credentials'
            ? 401
            : 500;

      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status }
      );
    }

    const { user } = result;
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        metadata: user.metadata,
      },
    });

    const sessionCookie = createSessionCookie(user.username, user.role);
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error('[auth] Login failure', error);
    return NextResponse.json(
      { success: false, error: 'Authentication service failure' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
