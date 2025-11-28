'use client';

import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CopyButtonProps {
  text: string;
  title?: string;
  className?: string;
}

/**
 * Reusable copy-to-clipboard button with visual feedback.
 * Shows a checkmark for 2 seconds after successful copy.
 */
export default function CopyButton({ text, title = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      title={title}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-green-600" />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
      )}
    </button>
  );
}
