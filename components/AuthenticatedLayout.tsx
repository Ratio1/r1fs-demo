"use client";

import { ReactNode } from "react";
import Header from "./Header";
import ToastContainer from "./Toast";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  showTransferMode?: boolean;
  transferMode?: "streaming" | "base64";
  onTransferModeChange?: (mode: "streaming" | "base64") => void;
}

export default function AuthenticatedLayout({
  children,
  showTransferMode = false,
  transferMode = "streaming",
  onTransferModeChange = () => {},
}: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ratio1-50 via-purple-50 to-ratio1-100">
      <Header
        showTransferMode={showTransferMode}
        transferMode={transferMode}
        onTransferModeChange={onTransferModeChange}
      />
      {children}
      <ToastContainer />
    </div>
  );
}

