/**
 * Files List API Route
 * =====================
 *
 * Discovers and returns all files stored across the Ratio1 network.
 *
 * Data Flow:
 * 1. Query CStore with hgetall() to get all file metadata under our HKEY
 * 2. Each edge node stores its files as a JSON array under its node address
 * 3. Parse and transform the metadata into a consistent format
 * 4. Return files grouped by the node that stores them
 *
 * CStore HKEY Structure:
 * {
 *   "node_address_1": "[{cid, filename, owner, ...}, ...]",
 *   "node_address_2": "[{cid, filename, owner, ...}, ...]"
 * }
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';
import { FilesData, FileMetadata } from '@/lib/types';

export async function GET() {
  try {
    const client = getRatio1NodeClient();

    // Query CStore for all file metadata under our application's HKEY
    // hgetall returns all key-value pairs stored in the hash
    const data = await client.cstore.hgetall({ hkey: config.HKEY });

    // The response may be wrapped - extract the actual result
    const result = (data as any).result || data || {};

    // Transform CStore data into our FilesData format
    const transformedFiles: FilesData = {};

    Object.entries(result).forEach(([machine, stringifiedArray]) => {
      try {
        // CStore values are always strings - parse the JSON array
        const parsed = JSON.parse(stringifiedArray as string);

        if (Array.isArray(parsed)) {
          // Handle legacy format: array of CID strings ["cid1", "cid2"]
          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            transformedFiles[machine] = parsed.map((cid: string) => ({
              cid,
              filename: `file_${cid.substring(0, 8)}`,
              date_uploaded: new Date().toISOString(),
              owner: 'Unknown',
              isEncryptedWithCustomKey: false,
            }));
          } else {
            // Current format: array of FileMetadata objects
            transformedFiles[machine] = parsed as FileMetadata[];
          }
        } else {
          transformedFiles[machine] = [];
        }
      } catch (parseError) {
        console.error(`Error parsing data for machine ${machine}:`, parseError);
        transformedFiles[machine] = [];
      }
    });

    return NextResponse.json(transformedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
