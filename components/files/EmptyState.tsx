'use client';

import { DocumentIcon } from '@heroicons/react/24/outline';

export default function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="bg-gradient-to-br from-ratio1-100 to-purple-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <DocumentIcon className="h-12 w-12 text-ratio1-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
      <p className="text-gray-600 mb-6">Upload your first file to get started with Ratio1 Drive</p>
      <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-4 border border-ratio1-200">
        <p className="text-sm text-gray-700">
          Your files will appear here once uploaded to the decentralized network
        </p>
      </div>
    </div>
  );
}
