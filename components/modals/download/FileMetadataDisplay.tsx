'use client';

import {
  DocumentIcon,
  CalendarIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/outline';
import CopyButton from '@/components/common/CopyButton';
import { FileMetadata } from '@/lib/types';

interface FileMetadataDisplayProps {
  file: FileMetadata;
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

export default function FileMetadataDisplay({ file }: FileMetadataDisplayProps) {
  return (
    <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-6 border border-ratio1-200">
      <div className="flex items-start space-x-4">
        <div className="bg-gradient-to-br from-ratio1-100 to-purple-100 p-3 rounded-xl shadow-sm">
          <DocumentIcon className="h-6 w-6 text-ratio1-600" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900 truncate" title={file.filename}>
              {file.filename}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Uploaded: {formatDate(file.date_uploaded)}</span>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">Owner</span>
              </div>
              <CopyButton text={file.owner} title="Copy Owner" />
            </div>
            <p className="text-xs text-gray-600 font-medium">{file.owner}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {file.isEncryptedWithCustomKey ? (
                  <LockClosedIcon className="h-4 w-4 text-red-500" />
                ) : (
                  <LockOpenIcon className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs font-medium text-gray-700">Encryption</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {file.isEncryptedWithCustomKey ? 'Custom Key Required' : 'Public File'}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <FingerPrintIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Content ID</span>
              </div>
              <CopyButton text={file.cid} title="Copy Content ID" />
            </div>
            <p className="text-xs text-gray-600 font-mono truncate" title={file.cid}>
              {file.cid}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
