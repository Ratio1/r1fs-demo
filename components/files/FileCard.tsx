'use client';

import {
  DocumentIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { FileMetadata } from '@/lib/types';

interface FileCardProps {
  file: FileMetadata;
  isCurrentNode: boolean;
  onDownload: (file: FileMetadata) => void;
  onShare: (file: FileMetadata) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FileCard({ file, isCurrentNode, onDownload, onShare }: FileCardProps) {
  return (
    <div
      className={`group rounded-xl p-6 transition-all duration-300 ${
        isCurrentNode
          ? 'bg-white/80 backdrop-blur-sm border border-ratio1-200 hover:bg-ratio1-50 hover:shadow-lg hover:scale-105'
          : 'bg-gray-50/80 hover:bg-gray-100/80 hover:shadow-md hover:scale-102'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl shadow-sm ${
            isCurrentNode ? 'bg-gradient-to-br from-ratio1-100 to-purple-100' : 'bg-white'
          }`}
        >
          <DocumentIcon className={`h-6 w-6 ${isCurrentNode ? 'text-ratio1-600' : 'text-gray-500'}`} />
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onShare(file)}
            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer ${
              isCurrentNode
                ? 'text-ratio1-600 hover:text-ratio1-700 hover:bg-ratio1-100'
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDownload(file)}
            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer ${
              isCurrentNode
                ? 'text-ratio1-600 hover:text-ratio1-700 hover:bg-ratio1-100'
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 truncate" title={file.filename}>
          {file.filename}
        </h4>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDate(file.date_uploaded)}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <UserIcon className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600 font-medium">{file.owner}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          {file.isEncryptedWithCustomKey ? (
            <>
              <LockClosedIcon className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">Encrypted</span>
            </>
          ) : (
            <>
              <LockOpenIcon className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">Public</span>
            </>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400 font-mono truncate" title={file.cid}>
            {file.cid}
          </p>
        </div>
      </div>
    </div>
  );
}
