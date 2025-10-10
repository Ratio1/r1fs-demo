import { NextRequest, NextResponse } from 'next/server';
import { getRatio1NodeClient } from '@/lib/ratio1-client';

function getR1FSClient() {
  return getRatio1NodeClient().r1fs;
}

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

    const r1fs = getR1FSClient();

    if (mode === 'streaming') {
      const result = await r1fs.getFile({ cid, secret });

      // Handle the union type - result could be R1FSDownloadResult or R1FSDownloadResponse
      if ('result' in result) {
        // This is R1FSDownloadResponse (fullResponse: true)
        return new NextResponse(result.result.file_data, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${result.result.filename || 'file'}"`,
          },
        });
      } else {
        // This is R1FSDownloadResult (fullResponse: false)
        return new NextResponse(result.file_data, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${result.filename || 'file'}"`,
          },
        });
      }
    }

    const result = await (r1fs as any).getFileBase64(cid, secret);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cid, secret, mode } = await request.json();

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    const r1fs = getR1FSClient();

    if (mode === 'streaming') {
      const result = await r1fs.getFile({ cid, secret });

      // Handle the union type - result could be R1FSDownloadResult or R1FSDownloadResponse
      if ('result' in result) {
        // This is R1FSDownloadResponse (fullResponse: true)
        return new NextResponse(result.result.file_data, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${result.result.filename || 'file'}"`,
          },
        });
      } else {
        // This is R1FSDownloadResult (fullResponse: false)
        return new NextResponse(result.file_data, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${result.filename || 'file'}"`,
          },
        });
      }
    }

    const result = await (r1fs as any).getFileBase64(cid, secret);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
