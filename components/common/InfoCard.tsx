'use client';

import { ComponentType } from 'react';
import CopyButton from '@/components/common/CopyButton';

interface InfoCardProps {
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  value: string;
  copyable?: boolean;
  copyTitle?: string;
}

export default function InfoCard({
  icon: Icon,
  iconColor = 'text-ratio1-600',
  label,
  value,
  copyable = false,
  copyTitle,
}: InfoCardProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        {copyable && <CopyButton text={value} title={copyTitle || `Copy ${label}`} />}
      </div>
      <div className="address-display">{value}</div>
    </div>
  );
}
