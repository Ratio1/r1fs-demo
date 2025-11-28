/**
 * Application Configuration
 * ==========================
 *
 * Centralized configuration management for the R1FS + CStore Starter Kit.
 * All configuration is driven by environment variables, ensuring the same
 * code works across all deployment environments (sandbox, devnet, production).
 *
 * Environment Variable Naming:
 * - EE_* prefix: Used when running inside an R1EN (Execution Environment)
 * - Fallback names: Used for local development or external deployments
 *
 * Quick Reference:
 * ┌─────────────────────────────┬────────────────────────────────────────────┐
 * │ Variable                    │ Description                                │
 * ├─────────────────────────────┼────────────────────────────────────────────┤
 * │ EE_CHAINSTORE_API_URL       │ CStore service URL (metadata storage)      │
 * │ EE_R1FS_API_URL             │ R1FS service URL (file storage)            │
 * │ EE_CSTORE_AUTH_HKEY         │ Hash key for storing user credentials      │
 * │ EE_CSTORE_AUTH_SECRET       │ Secret for password hashing                │
 * │ CSTORE_HKEY                 │ Hash key for file metadata (app namespace) │
 * └─────────────────────────────┴────────────────────────────────────────────┘
 *
 * Local Development:
 * - Sandbox mode: Set URLs to http://localhost:41234 (CStore) and 41235 (R1FS)
 * - R1EN Docker: Set URLs to the mapped container ports
 */

// Enable debug logging in development or when explicitly enabled
const rawDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

/**
 * Ensures a URL has the http:// or https:// protocol prefix.
 * Defaults to http:// for local development convenience.
 */
function ensureHttpProtocol(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://${url}`;
}

/**
 * Parses the CHAINSTORE_PEERS environment variable.
 * Expected format: JSON array of peer addresses, e.g. '["peer1:port", "peer2:port"]'
 */
function parseChainstorePeers(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) {
    return [];
  }

  try {
    let cleaned = raw;
    // Handle shell quoting artifacts
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

// -----------------------------------------------------------------------------
// Service URLs
// -----------------------------------------------------------------------------
// These are the core endpoints for the Ratio1 services.
// EE_* variants are auto-set when running inside an R1EN container.

const cstoreApiUrl = ensureHttpProtocol(
  process.env.EE_CHAINSTORE_API_URL || process.env.CHAINSTORE_API_URL
);

const r1fsApiUrl = ensureHttpProtocol(
  process.env.EE_R1FS_API_URL || process.env.R1FS_API_URL
);

const chainstorePeers = parseChainstorePeers(
  process.env.EE_CHAINSTORE_PEERS || process.env.CHAINSTORE_PEERS
);

// -----------------------------------------------------------------------------
// Authentication Configuration
// -----------------------------------------------------------------------------
// Uses CStore to persist user credentials (usernames, hashed passwords).

const authSessionCookieName = process.env.AUTH_SESSION_COOKIE || 'r1-session';
const authSessionTtlSeconds = parseInt(process.env.AUTH_SESSION_TTL_SECONDS || '86400', 10);
const cstoreAuthHkey = process.env.EE_CSTORE_AUTH_HKEY;
const cstoreAuthSecret = process.env.EE_CSTORE_AUTH_SECRET;
const cstoreBootstrapAdminPass = process.env.EE_CSTORE_BOOTSTRAP_ADMIN_PASS ?? null;

// -----------------------------------------------------------------------------
// Exported Configuration Object
// -----------------------------------------------------------------------------

export const config = {
  /**
   * HKEY - The hash key namespace for storing file metadata in CStore.
   * Each application should use a unique HKEY to avoid conflicts.
   * Default: 'ratio1-drive-test'
   */
  HKEY: process.env.CSTORE_HKEY || 'ratio1-drive-test',

  /** Enable debug logging */
  DEBUG: rawDebug,

  /** Maximum file size for uploads (in MB) */
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),

  /** CStore (ChainStore) service URL - for metadata and discovery */
  cstoreApiUrl,

  /** R1FS service URL - for file storage */
  r1fsApiUrl,

  /** Additional CStore peer addresses for redundancy */
  chainstorePeers,

  /** Authentication configuration */
  auth: {
    /** Name of the session cookie */
    sessionCookieName: authSessionCookieName,

    /** Session TTL in seconds (default: 24 hours) */
    sessionTtlSeconds: authSessionTtlSeconds,

    /** CStore-backed auth settings */
    cstore: {
      /** Hash key for storing user credentials in CStore */
      hkey: cstoreAuthHkey,

      /** Secret used for password hashing (keep secure!) */
      secret: cstoreAuthSecret,

      /**
       * Bootstrap admin password - creates initial admin user on first run.
       * IMPORTANT: Remove from env after first login for security!
       */
      bootstrapAdminPassword: cstoreBootstrapAdminPass,
    },
  },
} as const;

export type Config = typeof config;
