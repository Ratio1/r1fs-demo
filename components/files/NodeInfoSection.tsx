'use client';

import {
  CpuChipIcon,
  ServerIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CogIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import InfoCard from '@/components/common/InfoCard';

interface StatusData {
  [key: string]: any;
  ee_node_address?: string;
  ee_node_alias?: string;
  ee_node_eth_address?: string;
  server_node_addr?: string;
  EE_ID?: string;
}

interface NodeInfoSectionProps {
  r1fsStatus: StatusData | null;
  cstoreStatus: StatusData | null;
}

export default function NodeInfoSection({ r1fsStatus, cstoreStatus }: NodeInfoSectionProps) {
  if (!r1fsStatus) return null;

  const getCurrentNodeAddress = () => {
    return (
      r1fsStatus?.server_node_addr ||
      r1fsStatus?.ee_node_address ||
      cstoreStatus?.server_node_addr ||
      cstoreStatus?.ee_node_address ||
      null
    );
  };

  const ethAddress = r1fsStatus?.ee_node_eth_address || null;
  const nodeAddress = getCurrentNodeAddress();

  return (
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
  );
}
