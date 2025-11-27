'use client';

import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface OwnerInfoCardProps {
  username: string;
}

export default function OwnerInfoCard({ username }: OwnerInfoCardProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
      <div className="flex items-center space-x-3">
        <div className="bg-green-100 rounded-full p-2">
          <DocumentArrowUpIcon className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">File Owner</p>
          <p className="text-sm text-green-600">{username}</p>
        </div>
      </div>
    </div>
  );
}
