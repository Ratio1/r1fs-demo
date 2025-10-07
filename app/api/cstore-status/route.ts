import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/api-logger';
import { config } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const logger = createApiLogger();

  try {
    logger.logRequest(request);

    const client = getRatio1NodeClient();
    const status = await client.cstore.getStatus({ fullResponse: true });
    const data = {
      ...status,
      chainstore_peers: config.chainstorePeers,
    };
    console.log('CStore Status API response data:', JSON.stringify(data, null, 2));

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
