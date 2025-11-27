'use client';

import { useState } from 'react';
import { FilesData, FileMetadata } from '@/lib/types';
import { useStatus } from '@/lib/contexts/StatusContext';
import DownloadModal from './DownloadModal';
import StatusModal from './StatusModal';
import ShareModal from './ShareModal';
import NodeInfoSection from '@/components/files/NodeInfoSection';
import FileListHeader from '@/components/files/FileListHeader';
import FileMachineGroup from '@/components/files/FileMachineGroup';
import EmptyState from '@/components/files/EmptyState';

interface FileListProps {
  files: FilesData;
  transferMode: 'streaming' | 'base64';
  onRefresh: () => void;
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

  return (
    <div className="space-y-8">
      <NodeInfoSection r1fsStatus={r1fsStatus} cstoreStatus={cstoreStatus} />

      <FileListHeader
        totalFiles={getTotalFiles()}
        onStatusClick={() => setShowStatusModal(true)}
        onRefresh={onRefresh}
      />

      {sortedEntries.map(([machine, machineFiles]) => (
        <FileMachineGroup
          key={machine}
          machine={machine}
          files={machineFiles}
          isCurrentNode={isCurrentNode(machine)}
          onDownload={handleDownloadClick}
          onShare={handleShareClick}
        />
      ))}

      {Object.keys(files).length === 0 && <EmptyState />}

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
