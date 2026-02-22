'use client';

import { useState, ComponentType } from 'react';
import { FilesData, FileMetadata } from '@/lib/types';
import { useStatus } from '@/lib/contexts/StatusContext';
import DownloadModal from './DownloadModal';
import StatusModal from './StatusModal';
import ShareModal from './ShareModal';
import CopyButton from '@/components/common/CopyButton';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShareIcon,
  InformationCircleIcon,
  ArrowPathRoundedSquareIcon,
  CpuChipIcon,
  ServerIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CogIcon,
  SignalIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface FileListProps {
  files: FilesData;
  transferMode: 'streaming' | 'base64';
  onRefresh: () => void;
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

interface InfoCardProps {
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  value: string;
  copyable?: boolean;
}

function InfoCard({ icon: Icon, iconColor = 'text-ratio1-600', label, value, copyable = false }: InfoCardProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        {copyable && <CopyButton text={value} title={`Copy ${label}`} />}
      </div>
      <div className="address-display">{value}</div>
    </div>
  );
}

interface FileCardProps {
  file: FileMetadata;
  isCurrentNode: boolean;
  onDownload: (file: FileMetadata) => void;
  onShare: (file: FileMetadata) => void;
}

function FileCard({ file, isCurrentNode, onDownload, onShare }: FileCardProps) {
  return (
    <div
      className={`group rounded-xl p-6 transition-all duration-300 ${
        isCurrentNode
          ? 'bg-white/80 backdrop-blur-sm border border-ratio1-200 hover:bg-ratio1-50 hover:shadow-lg hover:scale-105'
          : 'bg-gray-50/80 hover:bg-gray-100/80 hover:shadow-md hover:scale-102'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl shadow-sm ${
            isCurrentNode ? 'bg-gradient-to-br from-ratio1-100 to-purple-100' : 'bg-white'
          }`}
        >
          <DocumentIcon className={`h-6 w-6 ${isCurrentNode ? 'text-ratio1-600' : 'text-gray-500'}`} />
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onShare(file)}
            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer ${
              isCurrentNode
                ? 'text-ratio1-600 hover:text-ratio1-700 hover:bg-ratio1-100'
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDownload(file)}
            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer ${
              isCurrentNode
                ? 'text-ratio1-600 hover:text-ratio1-700 hover:bg-ratio1-100'
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 truncate" title={file.filename}>
          {file.filename}
        </h4>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDate(file.date_uploaded)}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <UserIcon className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600 font-medium">{file.owner}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          {file.isEncryptedWithCustomKey ? (
            <>
              <LockClosedIcon className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">Encrypted</span>
            </>
          ) : (
            <>
              <LockOpenIcon className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">Public</span>
            </>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400 font-mono truncate" title={file.cid}>
            {file.cid}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FileList({ files, transferMode, onRefresh }: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { r1fsStatus, cstoreStatus } = useStatus();

  const handleDownloadClick = (file: FileMetadata) => {
    setSelectedFile(file);
    setShowDownloadModal(true);
  };

  const handleShareClick = (file: FileMetadata) => {
    setSelectedFile(file);
    setShowShareModal(true);
  };

  const getTotalFiles = () => {
    return Object.values(files).reduce((total, machineFiles) => total + machineFiles.length, 0);
  };

  const getCurrentNodeAddress = () => {
    return (
      r1fsStatus?.server_node_addr ||
      r1fsStatus?.ee_node_address ||
      cstoreStatus?.server_node_addr ||
      cstoreStatus?.ee_node_address ||
      null
    );
  };

  const isCurrentNode = (machine: string) => {
    const currentNodeAddress = getCurrentNodeAddress();
    return currentNodeAddress && machine === currentNodeAddress;
  };

  const sortedEntries = Object.entries(files).sort(([machineA], [machineB]) => {
    const isCurrentA = isCurrentNode(machineA);
    const isCurrentB = isCurrentNode(machineB);
    if (isCurrentA && !isCurrentB) return -1;
    if (!isCurrentA && isCurrentB) return 1;
    return 0;
  });

  const ethAddress = r1fsStatus?.ee_node_eth_address || null;
  const nodeAddress = getCurrentNodeAddress();

  return (
    <div className="space-y-8">
      {/* Node Info Section */}
      {r1fsStatus && (
        <div className="card-glass p-8 border-0">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600 p-4 rounded-2xl shadow-lg">
                <CpuChipIcon className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <SignalIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-bold gradient-text mb-2">Current Node Information</h3>
                <p className="text-gray-600">Current node status and configuration details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard
                  icon={ServerIcon}
                  iconColor="text-ratio1-600"
                  label="Node Alias"
                  value={r1fsStatus?.ee_node_alias || 'N/A'}
                  copyable
                />

                <InfoCard
                  icon={CurrencyDollarIcon}
                  iconColor="text-green-600"
                  label="ETH Address"
                  value={ethAddress || 'Not available'}
                  copyable={!!ethAddress}
                />

                {nodeAddress && (
                  <InfoCard
                    icon={GlobeAltIcon}
                    iconColor="text-blue-600"
                    label="Node Address"
                    value={nodeAddress}
                    copyable
                  />
                )}

                {r1fsStatus?.EE_ID && (
                  <InfoCard
                    icon={CogIcon}
                    iconColor="text-purple-600"
                    label="EE ID"
                    value={r1fsStatus.EE_ID}
                    copyable
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File List Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold gradient-text">Files</h2>
            <div className="bg-gradient-to-r from-ratio1-100 to-purple-100 text-ratio1-800 px-4 py-2 rounded-full text-sm font-semibold border border-ratio1-200">
              {getTotalFiles()} files
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowStatusModal(true)} className="btn-secondary flex items-center space-x-2">
            <InformationCircleIcon className="h-5 w-5" />
            <span>Node Status</span>
          </button>
          <button onClick={onRefresh} className="btn-primary flex items-center space-x-2">
            <ArrowPathRoundedSquareIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* File Machine Groups */}
      {sortedEntries.map(([machine, machineFiles]) => {
        const isCurrent = isCurrentNode(machine);
        return (
          <div
            key={machine}
            className={`card p-8 ${
              isCurrent ? 'card-glass border-2 border-ratio1-300 shadow-xl float-animation' : 'hover:shadow-xl'
            }`}
          >
            <div className="flex items-center space-x-4 mb-8">
              <div
                className={`relative p-4 rounded-2xl shadow-lg ${
                  isCurrent
                    ? 'bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}
              >
                {isCurrent ? (
                  <StarIcon className="h-8 w-8 text-white" />
                ) : (
                  <ServerIcon className="h-8 w-8 text-gray-600" />
                )}
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                    <StarIcon className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-gray-900">{machine}</h3>
                  {isCurrent && <span className="status-badge status-badge-success">Current Node</span>}
                </div>
                <p className="text-gray-600 mt-1">{machineFiles.length} files stored</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {machineFiles.map((file) => (
                <FileCard
                  key={file.cid}
                  file={file}
                  isCurrentNode={isCurrent}
                  onDownload={handleDownloadClick}
                  onShare={handleShareClick}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {Object.keys(files).length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-ratio1-100 to-purple-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <DocumentIcon className="h-12 w-12 text-ratio1-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600 mb-6">Upload your first file to get started with Ratio1 Drive</p>
          <div className="bg-gradient-to-r from-ratio1-50 to-purple-50 rounded-xl p-4 border border-ratio1-200">
            <p className="text-sm text-gray-700">
              Your files will appear here once uploaded to the decentralized network
            </p>
          </div>
        </div>
      )}

      {selectedFile && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          transferMode={transferMode}
        />
      )}

      {selectedFile && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
        />
      )}

      <StatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} />
    </div>
  );
}
