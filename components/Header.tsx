'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Switch } from '@headlessui/react';
import { Menu } from '@headlessui/react';
import {
  CloudIcon,
  SparklesIcon,
  UserIcon,
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/lib/contexts/UserContext';
import { useToast } from '@/lib/contexts/ToastContext';
import DualStatusWidget from './DualStatusWidget';
import { ComponentType } from 'react';

interface HeaderProps {
  transferMode?: 'streaming' | 'base64';
  onTransferModeChange?: (mode: 'streaming' | 'base64') => void;
  showTransferMode?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  show: boolean;
}

export default function Header({
  transferMode = 'streaming',
  onTransferModeChange = () => {},
  showTransferMode = false,
}: HeaderProps) {
  const { username } = useUser();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAdmin = username === 'admin';

  const isActive = (path: string) => pathname === path;

  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: HomeIcon, show: true },
    { href: '/profile', label: 'Profile', icon: UserCircleIcon, show: true },
    { href: '/users', label: 'Users', icon: UsersIcon, show: isAdmin },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to sign out');
      showToast('Signed out successfully.', 'success');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out', error);
      showToast('Unable to sign out. Try again.', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const UserHeader = () => (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ratio1-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <UserCircleIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
          <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'User'}</p>
        </div>
      </div>
    </div>
  );

  const LogoutButton = () => (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${
            active ? 'bg-red-50' : ''
          } flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      )}
    </Menu.Item>
  );

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600 p-3 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <CloudIcon className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                <SparklesIcon className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Ratio1 Drive</h1>
              {username && (
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">{username}</span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks
              .filter((link) => link.show)
              .map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-gradient-to-r from-ratio1-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
          </nav>

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

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white hover:ring-gray-300">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-ratio1-500 to-purple-600 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span>{username || 'User'}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-xl border border-gray-200/50 focus:outline-none overflow-hidden">
                  <UserHeader />
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 transition-colors`}
                        >
                          <UserCircleIcon className="h-5 w-5 text-gray-400" />
                          <span>My Profile</span>
                        </Link>
                      )}
                    </Menu.Item>
                    {isAdmin && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/users"
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 transition-colors`}
                          >
                            <UsersIcon className="h-5 w-5 text-gray-400" />
                            <span>Manage Users</span>
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <LogoutButton />
                  </div>
                </Menu.Items>
              </Menu>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center justify-center rounded-xl bg-white/80 p-2 text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white">
                  <Bars3Icon className="h-6 w-6" />
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg bg-white shadow-xl border border-gray-200/50 focus:outline-none overflow-hidden">
                  <UserHeader />
                  <div className="py-1">
                    {navLinks
                      .filter((link) => link.show)
                      .map((link) => {
                        const Icon = link.icon;
                        return (
                          <Menu.Item key={link.href}>
                            {({ active }) => (
                              <Link
                                href={link.href}
                                className={`${active ? 'bg-gray-50' : ''} ${
                                  isActive(link.href)
                                    ? 'bg-ratio1-50 text-ratio1-700 font-medium'
                                    : 'text-gray-700'
                                } flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors`}
                              >
                                <Icon className="h-5 w-5" />
                                <span>{link.label}</span>
                              </Link>
                            )}
                          </Menu.Item>
                        );
                      })}
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <LogoutButton />
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
