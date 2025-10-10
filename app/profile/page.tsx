"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowLeftIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@/lib/contexts/UserContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function ProfilePage() {
  const { username } = useUser();
  const router = useRouter();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // TODO: Fetch user details from API
  // For now, using context data
  const userRole = username === "admin" ? "admin" : "user";

  const getRoleIcon = (role: string) => {
    return role === "admin" ? (
      <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
    ) : (
      <ShieldExclamationIcon className="h-6 w-6 text-blue-600" />
    );
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "admin"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (!username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-ratio1-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <UserCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  My Profile
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage your account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-glass mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Account Information
            </h2>
          </div>

          <div className="p-6">
            {/* Profile Header with Avatar */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-ratio1-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <UserCircleIcon className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {username}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleIcon(userRole)}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(
                      userRole
                    )}`}
                  >
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">Username</span>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {username}
                </p>
              </div>

              {/* Role */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  {getRoleIcon(userRole)}
                  <span className="text-sm font-semibold">Role</span>
                </div>
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {userRole}
                </p>
              </div>

              {/* File Quota - Placeholder */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">File Quota</span>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Unlimited
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  0 files uploaded
                </p>
              </div>

              {/* Member Since - Placeholder */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">Member Since</span>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="card-glass">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Security Settings
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-md">
                  <KeyIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Password
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Change your password to keep your account secure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <KeyIcon className="h-4 w-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          username={username}
        />
      </div>
    </div>
  );
}

