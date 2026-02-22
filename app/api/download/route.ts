/**
 * File Download API Route
 * ========================
 *
 * Retrieves files from the R1FS distributed storage network.
 *
 * Data Flow:
 * 1. Client provides CID (Content Identifier) and optional secret
 * 2. Query R1FS for the file data via SDK
 * 3. Stream file back to client (or return as base64)
 *
 * Supported Download Modes:
 * - Streaming: Direct binary stream, efficient for large files
 * - Base64: JSON response with base64-encoded file data
 *
 * Parameters:
 * - cid (required): Content identifier of the file to download
 * - secret (optional): Decryption key if the file was encrypted
 * - mode (optional): 'streaming' (default) or 'base64'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRatio1NodeClient } from '@/lib/ratio1-client';

/**
 * Builds an HTTP response from R1FS download result.
 *
 * The SDK may return data in different formats depending on version.
 * This helper normalizes the response for streaming file delivery.
 */
function buildFileResponse(result: any): NextResponse {
  // Handle wrapped response format { result: { file_data, filename } }
  const fileData = result?.result?.file_data || result?.file_data;
  const filename = result?.result?.filename || result?.filename || 'file';

  return new NextResponse(fileData, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Core download logic - used by both GET and POST handlers.
 */
async function handleDownload(
  cid: string,
  secret: string | undefined,
  mode: string
): Promise<NextResponse> {
  const r1fs = getRatio1NodeClient().r1fs;

  if (mode === 'streaming') {
    // Streaming mode: Retrieve file and stream directly to client
    // This is more efficient for large files
    const result = await r1fs.getFile({ cid, secret });
    return buildFileResponse(result);
  }

  // Base64 mode: Return file as JSON with base64-encoded content
  // Useful for mobile apps or when binary streaming isn't available
  const result = await r1fs.getFileBase64({ cid, secret });
  return NextResponse.json(result);
}

/**
 * GET handler - Download via query parameters
 * Example: /api/download?cid=Qm...&secret=mykey&mode=streaming
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    const secret = searchParams.get('secret') || undefined;
    const mode = searchParams.get('mode') || 'streaming';

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    return await handleDownload(cid, secret, mode);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Download via JSON body
 * Useful when CID or secret contain special characters
 */
export async function POST(request: NextRequest) {
  try {
    const { cid, secret, mode = 'streaming' } = await request.json();

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    return await handleDownload(cid, secret, mode);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
