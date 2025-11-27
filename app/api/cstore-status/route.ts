/**
 * CStore Status API Route
 * ========================
 *
 * Returns the health and status of the CStore (ChainStore) service.
 *
 * CStore is a distributed key-value store used for:
 * - Storing file metadata (CIDs, filenames, owners)
 * - Coordinating discovery across edge nodes
 * - Managing authentication credentials
 *
 * The status response includes node information, uptime, and peer connectivity.
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

    // Fetch CStore service status - includes node info, uptime, version
    const status = await client.cstore.getStatus();

    // Augment with local peer configuration
    const data = {
      ...status,
      chainstore_peers: config.chainstorePeers,
    };

    if (config.DEBUG) {
      console.log('CStore Status API response data:', JSON.stringify(data, null, 2));
    }

    const response = NextResponse.json(data);
    logger.logResponse(request, response, startTime, data);

    return response;
  } catch (error) {
    console.error('Error fetching CStore status:', error);
    logger.logError(request, error, startTime);

    return NextResponse.json(
      { error: 'Failed to fetch CStore status' },
      { status: 500 }
    );
  }
}
