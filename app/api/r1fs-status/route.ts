/**
 * R1FS Status API Route
 * ======================
 *
 * Returns the health and status of the R1FS (Ratio1 File System) service.
 *
 * R1FS is a distributed, content-addressed file storage system:
 * - Files are stored on edge nodes and addressed by CID (Content Identifier)
 * - Similar to IPFS, but optimized for the Ratio1 network
 * - Supports optional encryption with user-provided secret keys
 *
 * The status response includes node address, network info, and version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/api-logger';
import { config } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const logger = createApiLogger();

  try {
    logger.logRequest(request);

    // Get the SDK client singleton
    const client = getRatio1NodeClient();

    // Fetch R1FS service status - includes node address, network, version
    const data = await client.r1fs.getStatus();

    if (config.DEBUG) {
      console.log('R1FS Status API response data:', JSON.stringify(data, null, 2));
    }

    const response = NextResponse.json(data);
    logger.logResponse(request, response, startTime, data);

    return response;
  } catch (error) {
    console.error('Error fetching R1FS status:', error);
    logger.logError(request, error, startTime);

    return NextResponse.json(
      { error: 'Failed to fetch R1FS status' },
      { status: 500 }
    );
  }
}
