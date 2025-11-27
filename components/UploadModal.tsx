'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/lib/contexts/UserContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { apiService } from '@/lib/services/api-service';
import ModalHeader from '@/components/common/ModalHeader';
import PasswordInput from '@/components/common/PasswordInput';
import FileSelectionInput from '@/components/modals/upload/FileSelectionInput';
import OwnerInfoCard from '@/components/modals/upload/OwnerInfoCard';
import UploadProgressOverlay from '@/components/modals/upload/UploadProgressOverlay';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferMode: 'streaming' | 'base64';
  onUploadSuccess: (uploadData: { cid: string; filename: string; isEncrypted: boolean }) => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  transferMode,
  onUploadSuccess,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [secret, setSecret] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'chainstore' | 'completed'>(
    'idle'
  );
  const { username } = useUser();
  const { showToast } = useToast();

  const handleUpload = async () => {
    if (!selectedFile || !username) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadStep('uploading');

    try {
      let cid: string | undefined;

      if (transferMode === 'streaming') {
        const formData = new FormData();
        if (selectedFile.name) formData.append('filename', selectedFile.name);
        if (secret) formData.append('secret', secret);
        formData.append('owner', username);
        formData.append('file', selectedFile);

        const uploadResult = await apiService.uploadFileWithProgress(formData, (progress) => {
          setUploadProgress(progress);
        });
        cid = uploadResult?.result?.cid || uploadResult?.cid;
      } else {
        // Base64 mode
        const reader = new FileReader();
        const fileBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await apiService.uploadFileBase64({
          file_base64_str: fileBase64,
          filename: selectedFile.name,
          secret: secret || undefined,
          owner: username,
        });
        cid = uploadResult?.result?.cid || uploadResult?.cid;
        setUploadProgress(100);
      }

      if (cid) {
        setUploadStep('chainstore');
        setUploadStatus('success');
        setUploadMessage('File uploaded successfully!');
        setUploadStep('completed');
        showToast('File uploaded successfully!', 'success');
        onUploadSuccess({ cid, filename: selectedFile.name, isEncrypted: !!secret });
        setTimeout(() => handleClose(), 1500);
      } else {
        throw new Error('Upload successful but no CID received');
      }
    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadMessage(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSecret('');
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadProgress(0);
    setIsUploading(false);
    setUploadStep('idle');
    onClose();
  };

  const handleFileError = (message: string) => {
    setUploadStatus('error');
    setUploadMessage(message);
    showToast(message, 'error');
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card-glass p-8 w-full max-w-lg relative transform transition-all">
          <ModalHeader
            title="Upload File"
            subtitle="Store your file on the decentralized network"
            icon={CloudArrowUpIcon}
            onClose={handleClose}
          />

          <div className="space-y-6">
            {username && <OwnerInfoCard username={username} />}

            <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-4 border border-ratio1-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Transfer Mode</span>
                <span className="status-badge status-badge-info capitalize">{transferMode}</span>
              </div>
            </div>

            <FileSelectionInput
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onError={handleFileError}
            />

            <PasswordInput
              value={secret}
              onChange={setSecret}
              label="Secret Key (Optional)"
              placeholder="Enter secret key for encryption"
              hint="Leave empty for public files, or enter a secret for encrypted storage"
              disabled={isUploading}
            />

            {uploadMessage && (
              <div
                className={`flex items-center space-x-3 p-4 rounded-xl border ${
                  uploadStatus === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {uploadStatus === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{uploadMessage}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button onClick={handleClose} className="btn-secondary" disabled={isUploading}>
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || !username}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>

          {isUploading && <UploadProgressOverlay progress={uploadProgress} currentStep={uploadStep} />}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
