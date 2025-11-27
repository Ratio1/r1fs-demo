'use client';

import { useRef } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { config } from '@/lib/config';

interface FileSelectionInputProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onError: (message: string) => void;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileSelectionInput({
  selectedFile,
  onFileSelect,
  onError,
}: FileSelectionInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        onError(`File size exceeds the maximum limit of ${config.MAX_FILE_SIZE_MB}MB`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onFileSelect(null);
        return;
      }
      onFileSelect(file);
    }
  };

  const clearInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Select File (Max: {config.MAX_FILE_SIZE_MB}MB)
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group ${
          selectedFile
            ? 'border-ratio1-300 bg-ratio1-50/50'
            : 'border-gray-300 hover:border-ratio1-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        {selectedFile ? (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-ratio1-100 to-purple-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <DocumentArrowUpIcon className="h-8 w-8 text-ratio1-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center group-hover:bg-ratio1-100 transition-colors">
              <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 group-hover:text-ratio1-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Click to select a file</p>
              <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { formatFileSize };
