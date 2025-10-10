"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  UserPlusIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/lib/contexts/ToastContext";
import CreateUserModal from "@/components/CreateUserModal";
import EditUserModal from "@/components/EditUserModal";

interface User {
  username: string;
  role: "admin" | "user";
  metadata: {
    maxAllowedFiles?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  users?: User[];
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/users", {
        method: "GET",
        credentials: "include",
      });

      const data: UsersResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUserSuccess = (createdUser: {
    username: string;
    role: "admin" | "user";
    maxAllowedFiles?: number;
  }) => {
    const limitText =
      createdUser.maxAllowedFiles !== undefined
        ? ` (max files: ${createdUser.maxAllowedFiles})`
        : "";
    showToast(
      `Created user ${createdUser.username}${limitText}`,
      "success"
    );
    // Refresh the users list
    fetchUsers();
  };

  const handleCreateUserError = (message: string) => {
    showToast(message, "error");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleEditUserSuccess = (updatedUser: {
    username: string;
    role: "admin" | "user";
    maxAllowedFiles?: number;
  }) => {
    const limitText =
      updatedUser.maxAllowedFiles !== undefined
        ? ` (max files: ${updatedUser.maxAllowedFiles})`
        : " (unlimited)";
    showToast(
      `Updated user ${updatedUser.username}${limitText}`,
      "success"
    );
    // Refresh the users list
    fetchUsers();
  };

  const handleEditUserError = (message: string) => {
    showToast(message, "error");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleIcon = (role: "admin" | "user") => {
    return role === "admin" ? (
      <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
    ) : (
      <ShieldExclamationIcon className="h-5 w-5 text-blue-600" />
    );
  };

  const getRoleBadgeColor = (role: "admin" | "user") => {
    return role === "admin"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full border-2 border-ratio1-500 border-t-transparent animate-spin" />
              <span className="text-lg text-gray-600">Loading users...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage users, roles, and quotas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="card-glass">
            <div className="px-6 py-12 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Load Users
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {error}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center space-x-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Go Back</span>
                </button>
                <button
                  onClick={() => fetchUsers()}
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-ratio1-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-ratio1-600 hover:to-purple-700"
                >
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage users, roles, and quotas
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCreateUserOpen(true)}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-ratio1-500 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:from-ratio1-600 hover:to-purple-700"
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="card-glass">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Users ({users.length})
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first user.
              </p>
              <button
                onClick={() => setIsCreateUserOpen(true)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-ratio1-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-ratio1-600 hover:to-purple-700"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Create User</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ratio1-500 to-purple-600 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.metadata?.maxAllowedFiles !== undefined
                                ? `${user.metadata.maxAllowedFiles} files max`
                                : "Unlimited files"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {user.metadata?.maxAllowedFiles !== undefined
                              ? `${user.metadata.maxAllowedFiles} files`
                              : "Unlimited"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatDate(user.updatedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={isCreateUserOpen}
          onClose={() => setIsCreateUserOpen(false)}
          onSuccess={handleCreateUserSuccess}
          onError={handleCreateUserError}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          user={selectedUser}
          onSuccess={handleEditUserSuccess}
          onError={handleEditUserError}
        />
      </div>
    </div>
  );
}
