'use client';

import { ComponentType } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  onClose: () => void;
}

export default function ModalHeader({ title, subtitle, icon: Icon, onClose }: ModalHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="bg-gradient-to-br from-ratio1-500 via-purple-500 to-ratio1-600 p-3 rounded-xl shadow-lg">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
            <SparklesIcon className="h-2 w-2 text-white" />
          </div>
        </div>
        <div>
          <Dialog.Title className="text-2xl font-bold gradient-text">{title}</Dialog.Title>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
