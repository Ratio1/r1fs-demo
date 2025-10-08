import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { readSessionFromCookie } from '@/lib/auth/session';
import { config as appConfig } from '@/lib/config';
import { StatusProvider } from '@/lib/contexts/StatusContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import { ToastProvider } from '@/lib/contexts/ToastContext';

interface ProvidersProps {
  children: ReactNode;
}

export async function Providers({ children }: ProvidersProps) {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(appConfig.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);
  const username = session?.username ?? null;

  return (
    <ToastProvider>
      <UserProvider initialUsername={username}>
        <StatusProvider>
          {children}
        </StatusProvider>
      </UserProvider>
    </ToastProvider>
  );
}
