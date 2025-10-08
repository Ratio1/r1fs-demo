 'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import FileList from '@/components/FileList';
import UploadModal from '@/components/UploadModal';
import UploadSuccessModal from '@/components/UploadSuccessModal';
import ToastContainer from '@/components/Toast';
import { FilesData, TransferMode } from '@/lib/types';
import { useEeId } from '@/lib/contexts/StatusContext';
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
  const eeId = useEeId();
  const { username, isUserSet } = useUser();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ratio1-50 via-purple-50 to-ratio1-100">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ratio1-50 via-purple-50 to-ratio1-100">
      <Header
        transferMode={transferMode}
        onTransferModeChange={setTransferMode}
        eeId={eeId}
        username={username}
      />

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
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                <div className="text-2xl font-bold gradient-text">
                  {Object.keys(files).length}
                </div>
                <div className="text-sm text-gray-600">Active Nodes</div>
              </div>
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
            <p className="text-gray-600 text-sm">
              Decentralized file storage powered by blockchain technology
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
