'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@/lib/contexts/UserContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { apiService } from '@/lib/services/api-service';
import { config } from '@/lib/config';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferMode: 'streaming' | 'base64';
  onUploadSuccess: (uploadData: { cid: string; filename: string; isEncrypted: boolean }) => void;
}

export default function UploadModal({ isOpen, onClose, transferMode, onUploadSuccess }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [secret, setSecret] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'chainstore' | 'completed'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { username } = useUser();
  const { showToast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      const maxSizeBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSizeBytes) {
        const errorMessage = `File size exceeds the maximum limit of ${config.MAX_FILE_SIZE_MB}MB`;
        setUploadStatus('error');
        setUploadMessage(errorMessage);
        showToast(errorMessage, 'error');
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !username) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadStep('uploading');

    try {
      if (transferMode === 'streaming') {
        const formData = new FormData();
        if (selectedFile.name) formData.append('filename', selectedFile.name);
        if (secret) formData.append('secret', secret);
        formData.append('owner', username);
        formData.append('file', selectedFile);

        const uploadResult = await apiService.uploadFileWithProgress(formData, (progress) => {
          setUploadProgress(progress);
        });
        
        // Extract CID from the upload result
        const cid = uploadResult?.result?.cid || uploadResult?.cid;
        if (cid) {
          setUploadStep('chainstore');
          setUploadStatus('success');
          setUploadMessage('File uploaded successfully!');
          setUploadStep('completed');
          showToast('File uploaded successfully!', 'success');
          // Call the success callback with upload data
          onUploadSuccess({
            cid,
            filename: selectedFile.name,
            isEncrypted: !!secret
          });
          // Clean up modal after successful upload
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          throw new Error('Upload successful but no CID received');
        }
      } else {
        // Base64 mode
        const reader = new FileReader();
        const fileBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:type;base64, prefix
          };
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await apiService.uploadFileBase64({
          file_base64_str: fileBase64,
          filename: selectedFile.name,
          secret: secret || undefined,
          owner: username,
        });

        // Extract CID from the upload result
        const cid = uploadResult?.result?.cid || uploadResult?.cid;
        if (cid) {
          setUploadProgress(100);
          setUploadStep('chainstore');
          setUploadStatus('success');
          setUploadMessage('File uploaded successfully!');
          setUploadStep('completed');
          showToast('File uploaded successfully!', 'success');
          // Call the success callback with upload data
          onUploadSuccess({
            cid,
            filename: selectedFile.name,
            isEncrypted: !!secret
          });
          // Clean up modal after successful upload
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          throw new Error('Upload successful but no CID received');
        }
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
    setShowPassword(false);
    setUploadStep('idle');
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show owner information
  const showOwnerInfo = () => (
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

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card-glass p-8 w-full max-w-lg relative transform transition-all">
          {/* Enhanced Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600 p-3 rounded-xl shadow-lg">
                  <CloudArrowUpIcon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <SparklesIcon className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <Dialog.Title className="text-2xl font-bold gradient-text">
                  Upload File
                </Dialog.Title>
                <p className="text-sm text-gray-600">Store your file on the decentralized network</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Owner Information */}
            {showOwnerInfo()}

            {/* Transfer Mode Display */}
            <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-4 border border-ratio1-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Transfer Mode</span>
                <span className="status-badge status-badge-info capitalize">
                  {transferMode}
                </span>
              </div>
            </div>

            {/* File Selection */}
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
                  onChange={handleFileSelect}
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

            {/* Secret Input with Eye Icon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Secret Key (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret key for encryption"
                  className="input-field pr-12"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isUploading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Leave empty for public files, or enter a secret for encrypted storage
              </p>
            </div>

            {/* Status Messages */}
            {uploadMessage && (
              <div className={`flex items-center space-x-3 p-4 rounded-xl border ${
                uploadStatus === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {uploadStatus === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{uploadMessage}</span>
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={isUploading}
            >
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

          {/* Enhanced Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl space-y-8 p-8 shadow-2xl">
              {/* Animated Upload Icon */}
              <div className="relative">
                <div className="bg-gradient-to-br from-ratio1-500 to-purple-500 rounded-full p-6 animate-pulse">
                  <CloudArrowUpIcon className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Progress Section */}
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading to Ratio1 Drive</h3>
                  <p className="text-sm text-gray-600">Securing your file on the decentralized network</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-ratio1-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-ratio1-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {[
                    { label: 'Uploading File', key: 'uploading', icon: CloudArrowUpIcon },
                    { label: 'Storing to Chainstore', key: 'chainstore', icon: DocumentArrowUpIcon },
                    { label: 'Completed', key: 'completed', icon: CheckCircleIcon },
                  ].map((step, idx) => {
                    const stepIndexMap: Record<string, number> = {
                      uploading: 0,
                      chainstore: 1,
                      completed: 2,
                    };
                    const currentIndex = stepIndexMap[uploadStep];
                    const status = idx < currentIndex
                      ? 'done'
                      : idx === currentIndex
                        ? 'current'
                        : 'pending';
                    const IconComponent = step.icon;
                    
                    return (
                      <div key={step.key} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        {status === 'done' && (
                          <div className="bg-green-500 rounded-full p-1">
                            <CheckCircleIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {status === 'current' && (
                          <div className="bg-ratio1-500 rounded-full p-1">
                            <ArrowPathIcon className="h-4 w-4 text-white animate-spin" />
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="bg-gray-300 rounded-full p-1">
                            <IconComponent className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            status === 'done'
                              ? 'text-green-700'
                              : status === 'current'
                                ? 'text-ratio1-700'
                                : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>

    </Dialog>
  );
} 
