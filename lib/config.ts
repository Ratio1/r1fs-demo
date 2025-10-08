const rawDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

function ensureHttpProtocol(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://${url}`;
}

function parseChainstorePeers(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) {
    return [];
  }

  try {
    let cleaned = raw;

    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }

    cleaned = cleaned.replace(/'/g, '"');
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('CHAINSTORE_PEERS must be a JSON array');
    }

    return parsed.map((entry) => {
      if (typeof entry !== 'string') {
        throw new Error('CHAINSTORE_PEERS entries must be strings');
      }
      return entry;
    });
  } catch (error) {
    console.error('Failed to parse CHAINSTORE_PEERS env var:', error);
    throw error;
  }
}

const cstoreApiUrl = ensureHttpProtocol(
  process.env.EE_CHAINSTORE_API_URL || process.env.CHAINSTORE_API_URL
);

const r1fsApiUrl = ensureHttpProtocol(
  process.env.EE_R1FS_API_URL || process.env.R1FS_API_URL
);

const chainstorePeers = parseChainstorePeers(
  process.env.EE_CHAINSTORE_PEERS || process.env.CHAINSTORE_PEERS
);

const authSessionCookieName = process.env.AUTH_SESSION_COOKIE || 'r1-session';
const authSessionTtlSeconds = parseInt(process.env.AUTH_SESSION_TTL_SECONDS || '86400', 10);
const cstoreAuthHkey = process.env.EE_CSTORE_AUTH_HKEY;
const cstoreAuthSecret = process.env.EE_CSTORE_AUTH_SECRET;
const cstoreBootstrapAdminPass = process.env.EE_CSTORE_BOOTSTRAP_ADMIN_PASS ?? null;

export const config = {
  HKEY: process.env.CSTORE_HKEY || 'ratio1-drive-test',
  DEBUG: rawDebug,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  cstoreApiUrl,
  r1fsApiUrl,
  chainstorePeers,
  auth: {
    sessionCookieName: authSessionCookieName,
    sessionTtlSeconds: authSessionTtlSeconds,
    cstore: {
      hkey: cstoreAuthHkey,
      secret: cstoreAuthSecret,
      bootstrapAdminPassword: cstoreBootstrapAdminPass,
    },
  },
} as const;

export type Config = typeof config;
