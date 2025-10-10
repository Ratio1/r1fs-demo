"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserIcon,
  UserPlusIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/lib/contexts/ToastContext";
import CreateUserModal from "@/components/CreateUserModal";
import EditUserModal from "@/components/EditUserModal";
import Loader from "@/components/Loader";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

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

interface UserStatsResponse {
  success: boolean;
  stats?: Record<string, { fileCount: number }>;
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<Record<string, { fileCount: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch users and stats in parallel
      const [usersResponse, statsResponse] = await Promise.all([
        fetch("/api/users", {
          method: "GET",
          credentials: "include",
        }),
        fetch("/api/users/stats", {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const usersData: UsersResponse = await usersResponse.json();
      const statsData: UserStatsResponse = await statsResponse.json();

      if (!usersResponse.ok || !usersData.success) {
        throw new Error(usersData.error || "Failed to fetch users");
      }

      setUsers(usersData.users || []);
      setUserStats(statsData.stats || {});
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      <Loader 
        text="Loading users..."
        subtext="Fetching user data and quota information"
        size="lg"
        fullScreen
      />
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-ratio1-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <UsersIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">
                  User Management
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Manage users, roles, and quotas
                </p>
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
              <button
                onClick={() => fetchUsers()}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-ratio1-500 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:from-ratio1-600 hover:to-purple-700"
              >
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-ratio1-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <UsersIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">
                  User Management
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Manage users, roles, and quotas
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateUserOpen(true)}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-ratio1-500 to-purple-600 px-6 py-3 text-base font-medium text-white shadow-lg transition hover:from-ratio1-600 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
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
                              {userStats[user.username]?.fileCount || 0} files
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
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {userStats[user.username]?.fileCount || 0} /{" "}
                              {user.metadata?.maxAllowedFiles !== undefined
                                ? user.metadata.maxAllowedFiles
                                : "∞"}
                            </span>
                          </div>
                          {user.metadata?.maxAllowedFiles !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  ((userStats[user.username]?.fileCount || 0) / user.metadata.maxAllowedFiles) >= 0.9
                                    ? "bg-red-500"
                                    : ((userStats[user.username]?.fileCount || 0) / user.metadata.maxAllowedFiles) >= 0.7
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((userStats[user.username]?.fileCount || 0) / user.metadata.maxAllowedFiles) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
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
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          user={selectedUser}
          onSuccess={handleEditUserSuccess}
        />
      </div>
    </AuthenticatedLayout>
  );
}
