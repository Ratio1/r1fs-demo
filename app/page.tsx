 'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import FileList from '@/components/FileList';
import UploadModal from '@/components/UploadModal';
import UploadSuccessModal from '@/components/UploadSuccessModal';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import ActiveNodesWidget from '@/components/ActiveNodesWidget';
import { FilesData, TransferMode } from '@/lib/types';
import { useUser } from '@/lib/contexts/UserContext';
import { apiService } from '@/lib/services/api-service';

export default function Home() {
  const [files, setFiles] = useState<FilesData>({});
  const [transferMode, setTransferMode] = useState<TransferMode>('streaming');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadSuccessData, setUploadSuccessData] = useState<{
    cid: string;
    filename: string;
    isEncrypted: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isUserSet } = useUser();

  useEffect(() => {
    // Only fetch files in the browser, not during build
    if (typeof window !== 'undefined') {
      fetchFiles();
    } else {
      // During build, just set loading to false
      setIsLoading(false);
    }
  }, []);

  const fetchFiles = async () => {
    try {
      const transformedFiles = await apiService.getFiles();
      setFiles(transformedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (uploadData: { cid: string; filename: string; isEncrypted: boolean }) => {
    setUploadSuccessData(uploadData);
    setShowSuccessModal(true);
    setShowUploadModal(false);
    fetchFiles();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setUploadSuccessData(null);
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            {/* Clean Loading Animation */}
            <div className="flex flex-col items-center justify-center">
              {/* Main Spinner */}
              <div className="relative mb-8 flex justify-center">
                <div className="w-20 h-20 border-4 border-ratio1-200 border-t-ratio1-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              
              {/* Logo/Brand */}
              <div className="mb-6 flex justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-ratio1-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-ratio1-600 to-purple-600 bg-clip-text text-transparent">
                    Ratio1 Drive
                  </h1>
                </div>
              </div>
              
              {/* Loading Text */}
              <p className="text-gray-600 font-medium text-lg text-center">
                Loading your decentralized storage
              </p>
              
              {/* Animated Dots */}
              <div className="flex justify-center space-x-1 mt-4">
                <div className="w-2 h-2 bg-ratio1-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-ratio1-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      showTransferMode={true}
      transferMode={transferMode}
      onTransferModeChange={setTransferMode}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Upload Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary flex items-center space-x-3 text-lg px-8 py-4"
                disabled={!isUserSet}
              >
                <div className="relative">
                  <PlusIcon className="h-6 w-6" />
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                    <SparklesIcon className="h-2 w-2 text-white" />
                  </div>
                </div>
                <span>Upload File</span>
              </button>
              <div className="hidden sm:block">
                <p className="text-gray-600 text-sm">
                  Store your files securely on the decentralized network
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-4">
              <ActiveNodesWidget />
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                <div className="text-2xl font-bold gradient-text">
                  {Object.values(files).reduce((total, machineFiles) => total + machineFiles.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
            </div>
          </div>
        </div>

        {/* File List with enhanced spacing */}
        <div className="space-y-8">
          <FileList
            files={files}
            transferMode={transferMode}
            onRefresh={fetchFiles}
          />
        </div>

        {/* Upload Modal */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          transferMode={transferMode}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Upload Success Modal */}
        {uploadSuccessData && (
          <UploadSuccessModal
            isOpen={showSuccessModal}
            onClose={handleSuccessModalClose}
            cid={uploadSuccessData.cid}
            filename={uploadSuccessData.filename}
            isEncryptedWithCustomKey={uploadSuccessData.isEncrypted}
          />
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-ratio1-500 to-purple-500 p-2 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold gradient-text">Ratio1 Drive</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Decentralized file storage powered by blockchain technology
            </p>
            <a
              href="https://github.com/Ratio1/r1fs-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </AuthenticatedLayout>
  );
}
