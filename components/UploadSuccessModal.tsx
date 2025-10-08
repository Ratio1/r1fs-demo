'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  CloudArrowUpIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/lib/contexts/ToastContext';

interface UploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  cid: string;
  filename: string;
  isEncryptedWithCustomKey?: boolean;
}

export default function UploadSuccessModal({ isOpen, onClose, cid, filename, isEncryptedWithCustomKey }: UploadSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const shareUrl = `${window.location.origin}/file/${cid}`;
  const fullShareUrl = isEncryptedWithCustomKey ? `${shareUrl}}` : shareUrl;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card-glass p-8 w-full max-w-lg relative transform transition-all">
          {/* Enhanced Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <CheckCircleIcon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <SparklesIcon className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <Dialog.Title className="text-2xl font-bold gradient-text">
                  Upload Successful!
                </Dialog.Title>
                <p className="text-sm text-gray-600">Your file is now stored on the decentralized network</p>
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
            {/* Success Animation */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-6 w-20 h-20 mx-auto flex items-center justify-center mb-4">
                <CloudArrowUpIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">File Uploaded Successfully!</h3>
              <p className="text-sm text-gray-600">Your file is now securely stored and ready to share</p>
            </div>

            {/* File Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <DocumentIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 truncate">{filename}</p>
                  <p className="text-xs text-blue-600">CID: {cid}</p>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ShareIcon className="h-5 w-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">Share Your File</h4>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  Share this link with others to let them download your file:
                </p>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-300">
                    <p className="text-sm text-gray-800 break-all font-mono">
                      {fullShareUrl}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-ratio1-500 text-white hover:bg-ratio1-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Note */}
              {isEncryptedWithCustomKey && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 rounded-full p-2">
                      <LinkIcon className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Encrypted File</p>
                      <p className="text-xs text-amber-600">
                        This file is encrypted. Recipients will need the secret key to download it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <SparklesIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">How it works</p>
                    <p className="text-xs text-purple-600">
                      When someone visits this link, they&rsquo;ll see a download modal where they can retrieve your file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleClose}
              className="btn-secondary"
            >
              Done
            </button>
            <button
              onClick={copyToClipboard}
              className="btn-primary flex items-center space-x-2"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Copy & Share</span>
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
