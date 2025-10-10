import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSessionFromCookie } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';
import { FilesData } from '@/lib/types';

type UserStatsResponse = {
  success: boolean;
  stats?: Record<string, { fileCount: number }>;
  error?: string;
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(config.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);

  if (!session || session.username !== 'admin') {
    return NextResponse.json<UserStatsResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const client = getRatio1NodeClient();
    const data = await client.cstore.hgetall({ hkey: config.HKEY }, { fullResponse: true });
    const result = (data as any).result || {};

    // Count files per owner
    const userStats: Record<string, { fileCount: number }> = {};

    Object.entries(result).forEach(([_machine, stringifiedArray]) => {
      try {
        const parsed = JSON.parse(stringifiedArray as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((file: any) => {
            if (file && typeof file === 'object' && file.owner) {
              const owner = file.owner;
              if (!userStats[owner]) {
                userStats[owner] = { fileCount: 0 };
              }
              userStats[owner].fileCount += 1;
            }
          });
        }
      } catch (parseError) {
        console.error('Error parsing file data:', parseError);
      }
    });

    return NextResponse.json<UserStatsResponse>(
      {
        success: true,
        stats: userStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[users/stats] Failed to fetch user statistics', error);

    return NextResponse.json<UserStatsResponse>(
      { success: false, error: 'Failed to retrieve user statistics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

