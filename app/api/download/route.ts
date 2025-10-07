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
      const response = await r1fs.getFile({ cid, secret });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
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
      const response = await r1fs.getFile({ cid, secret });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
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
