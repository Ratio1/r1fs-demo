'use client';

import { ComponentType } from 'react';
import { SparklesIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Step {
  label: string;
  key: string;
  icon: ComponentType<{ className?: string }>;
}

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  progress?: number;
  steps?: Step[];
  currentStep?: string;
}

export default function LoadingOverlay({
  title,
  subtitle,
  icon: Icon,
  progress,
  steps,
  currentStep,
}: LoadingOverlayProps) {
  const getStepStatus = (stepKey: string, idx: number): 'done' | 'current' | 'pending' => {
    if (!steps || !currentStep) return 'pending';
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    if (idx < currentIndex) return 'done';
    if (idx === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl space-y-8 p-8 shadow-2xl">
      <div className="relative">
        <div className="bg-gradient-to-br from-ratio1-500 to-purple-500 rounded-full p-6 animate-pulse">
          <Icon className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce">
          <SparklesIcon className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-ratio1-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-ratio1-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.key, idx);
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  {status === 'done' && (
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {status === 'current' && (
                    <div className="bg-ratio1-500 rounded-full p-1">
                      <ArrowPathIcon className="h-4 w-4 text-white animate-spin" />
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="bg-gray-300 rounded-full p-1">
                      <StepIcon className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      status === 'done'
                        ? 'text-green-700'
                        : status === 'current'
                          ? 'text-ratio1-700'
                          : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
