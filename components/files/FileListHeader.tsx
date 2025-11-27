'use client';

import { InformationCircleIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

interface FileListHeaderProps {
  totalFiles: number;
  onStatusClick: () => void;
  onRefresh: () => void;
}

export default function FileListHeader({ totalFiles, onStatusClick, onRefresh }: FileListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-3xl font-bold gradient-text">Files</h2>
          <div className="bg-gradient-to-r from-ratio1-100 to-purple-100 text-ratio1-800 px-4 py-2 rounded-full text-sm font-semibold border border-ratio1-200">
            {totalFiles} files
          </div>
        </div>
      </div>
      <div className="flex space-x-3">
        <button onClick={onStatusClick} className="btn-secondary flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5" />
          <span>Node Status</span>
        </button>
        <button onClick={onRefresh} className="btn-primary flex items-center space-x-2">
          <ArrowPathRoundedSquareIcon className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
