'use client';

import { ServerIcon, StarIcon } from '@heroicons/react/24/outline';
import { FileMetadata } from '@/lib/types';
import FileCard from '@/components/files/FileCard';

interface FileMachineGroupProps {
  machine: string;
  files: FileMetadata[];
  isCurrentNode: boolean;
  onDownload: (file: FileMetadata) => void;
  onShare: (file: FileMetadata) => void;
}

export default function FileMachineGroup({
  machine,
  files,
  isCurrentNode,
  onDownload,
  onShare,
}: FileMachineGroupProps) {
  return (
    <div
      className={`card p-8 ${
        isCurrentNode ? 'card-glass border-2 border-ratio1-300 shadow-xl float-animation' : 'hover:shadow-xl'
      }`}
    >
      <div className="flex items-center space-x-4 mb-8">
        <div
          className={`relative p-4 rounded-2xl shadow-lg ${
            isCurrentNode
              ? 'bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600'
              : 'bg-gradient-to-br from-gray-100 to-gray-200'
          }`}
        >
          {isCurrentNode ? (
            <StarIcon className="h-8 w-8 text-white" />
          ) : (
            <ServerIcon className="h-8 w-8 text-gray-600" />
          )}
          {isCurrentNode && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
              <StarIcon className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-bold text-gray-900">{machine}</h3>
            {isCurrentNode && <span className="status-badge status-badge-success">Current Node</span>}
          </div>
          <p className="text-gray-600 mt-1">{files.length} files stored</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((file) => (
          <FileCard
            key={file.cid}
            file={file}
            isCurrentNode={isCurrentNode}
            onDownload={onDownload}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}
