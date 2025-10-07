import { config } from '../config';

export type SessionPayload = {
  username: string;
  issuedAt: number;
};

export type SessionCookie = {
  name: string;
  value: string;
  attributes: {
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
    path: string;
    maxAge: number;
  };
};

const SESSION_TTL_SECONDS = config.auth.sessionTtlSeconds;

function encodeSession(payload: SessionPayload): string {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const json = decodeURIComponent(value);
    const parsed = JSON.parse(json) as Partial<SessionPayload>;

    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.issuedAt !== 'number') {
      return null;
    }

    return {
      username: parsed.username,
      issuedAt: parsed.issuedAt,
    };
  } catch (error) {
    console.warn('Failed to decode session cookie', error);
    return null;
  }
}

export function isSessionExpired(payload: SessionPayload, now: number = Date.now()): boolean {
  const ageSeconds = Math.floor(now / 1000) - payload.issuedAt;
  return ageSeconds > SESSION_TTL_SECONDS;
}

export function createSessionCookie(username: string): SessionCookie {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    username,
    issuedAt,
  };

  return {
    name: config.auth.sessionCookieName,
    value: encodeSession(payload),
    attributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export function clearSessionCookie(): SessionCookie {
  return {
    name: config.auth.sessionCookieName,
    value: '',
    attributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 0,
    },
  };
}

export function readSessionFromCookie(value: string | undefined): SessionPayload | null {
  const payload = decodeSession(value);
  if (!payload) {
    return null;
  }

  if (isSessionExpired(payload)) {
    return null;
  }

  return payload;
}
