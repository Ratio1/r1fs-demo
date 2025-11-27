'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  CloudArrowDownIcon,
  SparklesIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { FileMetadata } from '@/lib/types';
import { useToast } from '@/lib/contexts/ToastContext';
import { apiService } from '@/lib/services/api-service';
import ModalHeader from '@/components/common/ModalHeader';
import PasswordInput from '@/components/common/PasswordInput';
import FileMetadataDisplay from '@/components/modals/download/FileMetadataDisplay';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileMetadata;
  transferMode: 'streaming' | 'base64';
}

export default function DownloadModal({ isOpen, onClose, file, transferMode }: DownloadModalProps) {
  const [secret, setSecret] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    if (file.isEncryptedWithCustomKey && !secret.trim()) {
      showToast(
        'This file is encrypted with a custom key. Please enter the secret key to download.',
        'error'
      );
      setHasError(true);
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('idle');
    setDownloadMessage('');
    setHasError(false);

    try {
      if (transferMode === 'streaming') {
        const response = await apiService.downloadFileStreaming(file.cid, secret);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = file.filename;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) filename = filenameMatch[1];
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const result = await apiService.downloadFileBase64(file.cid, secret);
        const binaryString = atob(result.file_base64_str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setDownloadStatus('success');
      setDownloadMessage('File downloaded successfully!');
      setTimeout(() => handleClose(), 2000);
    } catch (error) {
      setDownloadStatus('error');
      setHasError(true);
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      if (
        errorMessage.includes('decrypt') ||
        errorMessage.includes('key') ||
        errorMessage.includes('secret') ||
        errorMessage.includes('Not Found')
      ) {
        const wrongKeyMessage = 'Secret key might be wrong. Please check and try again.';
        setDownloadMessage(wrongKeyMessage);
        showToast(wrongKeyMessage, 'error');
      } else {
        setDownloadMessage(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    setSecret('');
    setDownloadStatus('idle');
    setDownloadMessage('');
    setIsDownloading(false);
    setHasError(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card-glass p-8 w-full max-w-lg relative transform transition-all">
          <ModalHeader
            title="Download File"
            subtitle="Retrieve your file from the decentralized network"
            icon={CloudArrowDownIcon}
            onClose={handleClose}
          />

          <div className="space-y-6">
            <FileMetadataDisplay file={file} />

            <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-4 border border-ratio1-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Transfer Mode</span>
                <span className="status-badge status-badge-info capitalize">{transferMode}</span>
              </div>
            </div>

            <PasswordInput
              value={secret}
              onChange={setSecret}
              label={`Secret Key ${file.isEncryptedWithCustomKey ? '' : '(Optional)'}`}
              placeholder={
                file.isEncryptedWithCustomKey
                  ? 'Enter secret key (required)'
                  : 'Enter secret key if required'
              }
              hint={
                file.isEncryptedWithCustomKey
                  ? 'This file is encrypted. You must enter the correct secret key to download.'
                  : 'Enter the secret key if this file was encrypted during upload'
              }
              required={file.isEncryptedWithCustomKey}
              disabled={isDownloading}
              hasError={hasError}
            />

            {hasError && (
              <p className="text-xs text-red-600 font-medium">
                Tip: If download fails, the secret key might be incorrect. Please double-check and
                try again.
              </p>
            )}

            {downloadMessage && (
              <div
                className={`flex items-center space-x-3 p-4 rounded-xl border ${
                  downloadStatus === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {downloadStatus === 'success' ? (
                  <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{downloadMessage}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button onClick={handleClose} className="btn-secondary" disabled={isDownloading}>
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading || (file.isEncryptedWithCustomKey && !secret.trim())}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isDownloading ? (
                <>
                  <ArrowDownTrayIcon className="h-5 w-5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-5 w-5" />
                  <span>Download File</span>
                </>
              )}
            </button>
          </div>

          {isDownloading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl space-y-6 p-8 shadow-2xl">
              <div className="relative">
                <div className="bg-gradient-to-br from-ratio1-500 to-purple-500 rounded-full p-6 animate-pulse">
                  <CloudArrowDownIcon className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Downloading File</h3>
                <p className="text-sm text-gray-600">Retrieving from decentralized storage</p>
                <div className="w-64 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-ratio1-500 to-purple-500 h-2 rounded-full animate-pulse"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
