'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ComponentType } from 'react';

interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  show: boolean;
}

interface HeaderNavigationProps {
  isAdmin: boolean;
}

export default function HeaderNavigation({ isAdmin }: HeaderNavigationProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: HomeIcon, show: true },
    { href: '/profile', label: 'Profile', icon: UserCircleIcon, show: true },
    { href: '/users', label: 'Users', icon: UsersIcon, show: isAdmin },
  ];

  return (
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
  );
}
