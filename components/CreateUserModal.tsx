"use client";

import { useState } from "react";
import { Dialog, Listbox } from "@headlessui/react";
import {
	UserPlusIcon,
	XMarkIcon,
	UserIcon,
	KeyIcon,
	ChevronUpDownIcon,
	CheckIcon,
	FolderPlusIcon,
} from "@heroicons/react/24/outline";

type UserRole = "admin" | "user";

interface CreateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (payload: {
		username: string;
		role: UserRole;
		maxAllowedFiles?: number;
	}) => void;
	onError?: (message: string) => void;
}

const ROLES: UserRole[] = ["user", "admin"];

export default function CreateUserModal({
	isOpen,
	onClose,
	onSuccess,
	onError,
}: CreateUserModalProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<UserRole>("user");
	const [maxAllowedFiles, setMaxAllowedFiles] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setUsername("");
		setPassword("");
		setRole("user");
		setMaxAllowedFiles("");
		setError(null);
		setIsSubmitting(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		const trimmedUsername = username.trim();
		const trimmedPassword = password.trim();

		if (!trimmedUsername || !trimmedPassword) {
			setError("Username and password are required.");
			return;
		}

		let metadataPayload: { maxAllowedFiles: number } | undefined;
		const trimmedMaxAllowed = maxAllowedFiles.trim();

		if (trimmedMaxAllowed) {
			const parsed = Number(trimmedMaxAllowed);
			if (!Number.isFinite(parsed) || parsed <= 0) {
				setError("Max allowed files must be a positive number.");
				return;
			}
			metadataPayload = { maxAllowedFiles: Math.floor(parsed) };
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const body: Record<string, unknown> = {
				username: trimmedUsername,
				password: trimmedPassword,
				role,
			};

			if (metadataPayload) {
				body.metadata = metadataPayload;
			}

			const response = await fetch("/api/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(body),
			});

			const payload = await response.json();

			if (!response.ok || !payload?.success) {
				const message = payload?.error || "Failed to create user.";
				setError(message);
				onError?.(message);
				return;
			}

			onSuccess?.({
				username: payload.user.username,
				role: payload.user.role,
				maxAllowedFiles: payload.user.metadata?.maxAllowedFiles,
			});
			handleClose();
		} catch (submitError) {
			const message =
				submitError instanceof Error
					? submitError.message
					: "Failed to create user.";
			setError(message);
			onError?.(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onClose={handleClose} className="relative z-50">
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				aria-hidden="true"
			/>

			<div className="fixed inset-0 flex items-center justify-center p-4">
				<Dialog.Panel className="card-glass w-full max-w-lg p-8">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center space-x-4">
							<div className="bg-gradient-to-br from-ratio1-500 to-purple-600 p-3 rounded-xl shadow-lg">
								<UserPlusIcon className="h-8 w-8 text-white" />
							</div>
							<div>
								<Dialog.Title className="text-2xl font-bold gradient-text">
									Create New User
								</Dialog.Title>
								<Dialog.Description className="text-sm text-gray-600">
									Provision a new account for Ratio1 Drive
									access.
								</Dialog.Description>
							</div>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
							aria-label="Close create user modal"
						>
							<XMarkIcon className="h-6 w-6" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Username
							</label>
							<input
								type="text"
								value={username}
								onChange={(event) =>
									setUsername(event.target.value)
								}
								className="input-field pl-10"
								placeholder="new.user"
								autoFocus
								disabled={isSubmitting}
								minLength={2}
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Password
							</label>
							<input
								type="password"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								className="input-field pl-10"
								placeholder="Strong password"
								disabled={isSubmitting}
								minLength={6}
								required
							/>
							<p className="text-xs text-gray-500 mt-2">
								Password must meet organization security
								requirements.
							</p>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Max allowed files
							</label>
							<input
								type="number"
								min={1}
								value={maxAllowedFiles}
								onChange={(event) =>
									setMaxAllowedFiles(event.target.value)
								}
								className="input-field pl-10"
								placeholder="Unlimited"
								disabled={isSubmitting}
							/>
							<p className="text-xs text-gray-500 mt-2">
								Leave blank for no limit. Enter a positive
								number to cap file ownership.
							</p>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Role
							</label>
							<Listbox value={role} onChange={setRole}>
								<div className="relative">
									<Listbox.Button className="input-field pr-10 text-left">
										<span className="block capitalize">
											{role}
										</span>
										<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
											<ChevronUpDownIcon className="h-5 w-5" />
										</span>
									</Listbox.Button>
									<Listbox.Options className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
										{ROLES.map((option) => (
											<Listbox.Option
												key={option}
												value={option}
												className={({ active }) =>
													`flex items-center justify-between px-4 py-3 text-sm capitalize cursor-pointer ${
														active
															? "bg-purple-50 text-purple-600"
															: "text-gray-700"
													}`
												}
											>
												{({ selected }) => (
													<>
														<span>{option}</span>
														{selected && (
															<CheckIcon className="h-4 w-4 text-purple-600" />
														)}
													</>
												)}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
						</div>

						{error && (
							<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
								{error}
							</div>
						)}

						<div className="flex justify-end space-x-4">
							<button
								type="button"
								onClick={handleClose}
								className="btn-secondary"
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
										<span>Creating...</span>
									</>
								) : (
									<>
										<UserPlusIcon className="h-5 w-5" />
										<span>Create user</span>
									</>
								)}
							</button>
						</div>
					</form>
				</Dialog.Panel>
			</div>
		</Dialog>
	);
}
