import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';
import { FilesData } from '@/lib/types';

export async function GET() {
  try {
    const client = getRatio1NodeClient();
    const data = await client.cstore.hgetall({ hkey: config.HKEY }, { fullResponse: true });
    const result = (data as any).result || {};

    const transformedFiles: FilesData = {};
    Object.entries(result).forEach(([machine, stringifiedArray]) => {
      try {
        const parsed = JSON.parse(stringifiedArray as string);
        if (Array.isArray(parsed)) {
          if (typeof parsed[0] === 'string') {
            transformedFiles[machine] = parsed.map((cid: string) => ({
              cid,
              filename: `file_${cid.substring(0, 8)}`,
              date_uploaded: new Date().toISOString(),
              owner: 'Unknown',
              isEncryptedWithCustomKey: false,
            }));
          } else {
            transformedFiles[machine] = parsed;
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
