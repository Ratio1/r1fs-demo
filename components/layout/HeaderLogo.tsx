'use client';

import Link from 'next/link';
import { CloudIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline';

interface HeaderLogoProps {
  username?: string | null;
}

export default function HeaderLogo({ username }: HeaderLogoProps) {
  return (
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
  );
}
