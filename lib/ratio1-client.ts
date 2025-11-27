/**
 * Ratio1 SDK Client Module
 * =========================
 *
 * This module provides a centralized, singleton-based client for interacting with
 * the Ratio1 distributed storage network. It exposes two services:
 *
 * **R1FS (Ratio1 File System)**
 * A distributed, content-addressed file storage system similar to IPFS.
 * - Files are stored across edge nodes and addressed by their CID (Content Identifier)
 * - Supports optional encryption with user-provided secret keys
 * - Methods: addFile(), getFile(), addFileBase64(), getFileBase64()
 *
 * **CStore (ChainStore)**
 * A distributed key-value store for metadata and coordination.
 * - Used to announce/discover file metadata across the network
 * - Supports simple key-value and hash-based storage
 * - Methods: setValue(), getValue(), hset(), hget(), hgetall()
 *
 * **Environment Configuration**
 * The SDK reads service URLs from environment variables:
 * - EE_CHAINSTORE_API_URL: CStore service endpoint (default: localhost:31234)
 * - EE_R1FS_API_URL: R1FS service endpoint (default: localhost:31235)
 *
 * **Why Separate Node/Browser Clients?**
 * - Node.js: Uses native streams for efficient large file handling
 * - Browser: Uses Fetch API and FormData for cross-origin requests
 * Both provide identical API surfaces for seamless isomorphic code.
 */

import createEdgeSdk from '@ratio1/edge-sdk-ts';
import { createEdgeSdkBrowserClient } from '@ratio1/edge-sdk-ts/browser';
import { config } from '@/lib/config';

/**
 * Shared configuration options for both Node.js and Browser clients.
 * These options are derived from environment variables via lib/config.ts.
 */
const sharedClientOptions = {
  cstoreUrl: config.cstoreApiUrl,
  r1fsUrl: config.r1fsApiUrl,
  chainstorePeers: config.chainstorePeers,
  debug: config.DEBUG,
  verbose: config.DEBUG,
} as const;

// Type definitions for SDK clients
type NodeClient = ReturnType<typeof createEdgeSdk>;
type BrowserClient = ReturnType<typeof createEdgeSdkBrowserClient>;

/**
 * Global singleton storage for the Node.js client.
 * This pattern ensures we reuse the same client instance across
 * all API routes, avoiding connection overhead and maintaining
 * consistent state during the server's lifecycle.
 */
type GlobalWithRatio1 = typeof globalThis & {
  __ratio1NodeClient?: NodeClient;
};

const globalWithRatio1 = globalThis as GlobalWithRatio1;

/**
 * Creates a new Node.js SDK client instance.
 * Called once per server lifecycle via the singleton pattern.
 */
function createNodeClient(): NodeClient {
  return createEdgeSdk(sharedClientOptions);
}

/**
 * Creates a new Browser SDK client instance.
 * Browser clients are typically created per-component as needed.
 */
function createBrowserClient(): BrowserClient {
  return createEdgeSdkBrowserClient(sharedClientOptions);
}

/**
 * Returns the singleton Node.js SDK client.
 *
 * Use this in API routes and server-side code to interact with R1FS and CStore.
 * The client is lazily initialized on first call and reused thereafter.
 *
 * @throws Error if called from browser context
 *
 * @example
 * // In an API route:
 * const client = getRatio1NodeClient();
 *
 * // Upload a file to R1FS
 * const result = await client.r1fs.addFile({ file, filename });
 *
 * // Store metadata in CStore
 * await client.cstore.hset({ hkey: 'files', key: nodeId, value: JSON.stringify(metadata) });
 */
export function getRatio1NodeClient(): NodeClient {
  if (typeof window !== 'undefined') {
    throw new Error('getRatio1NodeClient must only be called on the server');
  }

  if (!globalWithRatio1.__ratio1NodeClient) {
    globalWithRatio1.__ratio1NodeClient = createNodeClient();

    if (config.DEBUG) {
      console.log('[ratio1] Node client initialized', {
        cstoreUrl: sharedClientOptions.cstoreUrl,
        r1fsUrl: sharedClientOptions.r1fsUrl,
        chainstorePeers: sharedClientOptions.chainstorePeers,
      });
    }
  }

  return globalWithRatio1.__ratio1NodeClient;
}

/**
 * Returns an SDK client appropriate for the current environment.
 *
 * - Server-side: Returns the singleton Node.js client
 * - Browser: Creates a new Browser client instance
 *
 * Use this when you need a client that works in both contexts,
 * though typically you'll use getRatio1NodeClient() in API routes.
 */
export function getRatio1Client(): NodeClient | BrowserClient {
  return typeof window === 'undefined' ? getRatio1NodeClient() : createBrowserClient();
}
