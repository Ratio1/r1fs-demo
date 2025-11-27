'use client';

import { Switch } from '@headlessui/react';
import { useUser } from '@/lib/contexts/UserContext';
import DualStatusWidget from './DualStatusWidget';
import HeaderLogo from '@/components/layout/HeaderLogo';
import HeaderNavigation from '@/components/layout/HeaderNavigation';
import UserMenu from '@/components/layout/UserMenu';

interface HeaderProps {
  transferMode?: 'streaming' | 'base64';
  onTransferModeChange?: (mode: 'streaming' | 'base64') => void;
  showTransferMode?: boolean;
}

export default function Header({
  transferMode = 'streaming',
  onTransferModeChange = () => {},
  showTransferMode = false,
}: HeaderProps) {
  const { username } = useUser();
  const isAdmin = username === 'admin';

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <HeaderLogo username={username} />
          <HeaderNavigation isAdmin={isAdmin} />

          <div className="flex items-center space-x-3">
            {/* Transfer Mode Toggle - Only on home page */}
            {showTransferMode && (
              <div className="hidden lg:flex items-center space-x-4 bg-gray-100/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200/50 opacity-50 cursor-not-allowed">
                <span className="text-xs font-medium text-gray-400">Base64</span>
                <Switch
                  checked={transferMode === 'streaming'}
                  onChange={() =>
                    onTransferModeChange(transferMode === 'streaming' ? 'base64' : 'streaming')
                  }
                  disabled={true}
                  className="bg-gray-300 relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none cursor-not-allowed"
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-lg translate-x-7" />
                </Switch>
                <span className="text-xs font-medium text-gray-400">Streaming</span>
              </div>
            )}

            <DualStatusWidget />
            <UserMenu username={username} isAdmin={isAdmin} variant="desktop" />
            <UserMenu username={username} isAdmin={isAdmin} variant="mobile" />
          </div>
        </div>
      </div>
    </header>
  );
}
