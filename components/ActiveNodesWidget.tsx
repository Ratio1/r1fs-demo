'use client';

import { useState, useRef, useEffect } from 'react';
import { useStatus } from '@/lib/contexts/StatusContext';
import { ServerIcon } from '@heroicons/react/24/outline';

export default function ActiveNodesWidget() {
  const { cstoreStatus } = useStatus();
  const [showPeers, setShowPeers] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Extract chainstore peers from cstoreStatus
  const chainstorePeers = (cstoreStatus?.chainstore_peers || []) as string[];
  const peersCount = chainstorePeers.length;

  useEffect(() => {
    if (showPeers && widgetRef.current && tooltipRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let left = rect.left + window.scrollX;
      const top = rect.bottom + window.scrollY + 8;

      // Check if tooltip would overflow right edge
      if (left + tooltipRect.width > viewportWidth) {
        // Align tooltip's right edge with widget's right edge
        left = rect.right + window.scrollX - tooltipRect.width;

        // If still overflowing on the left, align with right viewport edge with padding
        if (left < 0) {
          left = viewportWidth - tooltipRect.width - 16;
        }
      }

      setTooltipPosition({ top, left });
    }
  }, [showPeers]);

  return (
    <>
      <div
        ref={widgetRef}
        className="relative bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 cursor-pointer hover:bg-white/80 hover:shadow-md transition-all duration-200"
        onMouseEnter={() => setShowPeers(true)}
        onMouseLeave={() => setShowPeers(false)}
      >
        <div className="text-2xl font-bold gradient-text">
          {peersCount}
        </div>
        <div className="text-sm text-gray-600">Active Nodes</div>
      </div>

      {/* Hover Tooltip - Fixed positioning */}
      {showPeers && peersCount > 0 && (
        <div
          ref={tooltipRef}
          className="fixed w-max max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 9999,
          }}
          onMouseEnter={() => setShowPeers(true)}
          onMouseLeave={() => setShowPeers(false)}
        >
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
            <ServerIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700">
              Active Nodes ({peersCount})
            </span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {chainstorePeers.map((peer, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-2 rounded-md bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 font-mono break-all">
                  {peer}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
