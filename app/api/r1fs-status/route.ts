import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/api-logger';
import { getRatio1NodeClient } from '@/lib/ratio1-client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const logger = createApiLogger();

  try {
    logger.logRequest(request);

    const client = getRatio1NodeClient();
    const data = await client.r1fs.getStatus({ fullResponse: true });
    console.log('R1FS Status API response data:', JSON.stringify(data, null, 2));

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
