"use client";

import { CloudIcon } from "@heroicons/react/24/outline";

interface LoaderProps {
  text?: string;
  subtext?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function Loader({
  text = "Loading...",
  subtext,
  size = "md",
  fullScreen = false,
}: LoaderProps) {
  const sizeClasses = {
    sm: {
      spinner: "h-8 w-8",
      icon: "h-4 w-4",
      text: "text-base",
      subtext: "text-sm",
    },
    md: {
      spinner: "h-12 w-12",
      icon: "h-6 w-6",
      text: "text-lg",
      subtext: "text-sm",
    },
    lg: {
      spinner: "h-16 w-16",
      icon: "h-8 w-8",
      text: "text-xl",
      subtext: "text-base",
    },
  };

  const classes = sizeClasses[size];

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Animated Icon with Spinner */}
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${classes.spinner} rounded-full border-4 border-gray-200 border-t-ratio1-500 animate-spin`}
        />
        
        {/* Inner icon with pulse animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-ratio1-500 to-purple-600 rounded-full blur-md opacity-50 animate-pulse" />
            
            {/* Icon */}
            <div className="relative bg-gradient-to-br from-ratio1-500 to-purple-600 rounded-full p-2">
              <CloudIcon className={`${classes.icon} text-white`} />
            </div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        <p className={`${classes.text} font-semibold text-gray-700`}>
          {text}
        </p>
        {subtext && (
          <p className={`${classes.subtext} text-gray-500`}>
            {subtext}
          </p>
        )}
      </div>

      {/* Animated dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-ratio1-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-ratio1-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-ratio1-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {loaderContent}
    </div>
  );
}

