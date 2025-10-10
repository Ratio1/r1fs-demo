"use client";

import { useState, useEffect } from "react";
import { Dialog, Listbox } from "@headlessui/react";
import {
	PencilSquareIcon,
	XMarkIcon,
	ChevronUpDownIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";

type UserRole = "admin" | "user";

interface EditUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: {
		username: string;
		role: UserRole;
		metadata?: {
			maxAllowedFiles?: number;
			[key: string]: any;
		};
	} | null;
	onSuccess?: (payload: {
		username: string;
		role: UserRole;
		maxAllowedFiles?: number;
	}) => void;
	onError?: (message: string) => void;
}

const ROLES: UserRole[] = ["user", "admin"];

export default function EditUserModal({
	isOpen,
	onClose,
	user,
	onSuccess,
	onError,
}: EditUserModalProps) {
	const [role, setRole] = useState<UserRole>("user");
	const [maxAllowedFiles, setMaxAllowedFiles] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Update form when user changes
	useEffect(() => {
		if (user) {
			setRole(user.role);
			setMaxAllowedFiles(
				user.metadata?.maxAllowedFiles !== undefined
					? String(user.metadata.maxAllowedFiles)
					: ""
			);
		}
	}, [user]);

	const resetForm = () => {
		if (user) {
			setRole(user.role);
			setMaxAllowedFiles(
				user.metadata?.maxAllowedFiles !== undefined
					? String(user.metadata.maxAllowedFiles)
					: ""
			);
		}
		setError(null);
		setIsSubmitting(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!user) {
			return;
		}

		let metadataPayload: { maxAllowedFiles?: number } | undefined;
		const trimmedMaxAllowed = maxAllowedFiles.trim();

		if (trimmedMaxAllowed) {
			const parsed = Number(trimmedMaxAllowed);
			if (!Number.isFinite(parsed) || parsed <= 0) {
				setError("Max allowed files must be a positive number.");
				return;
			}
			metadataPayload = { maxAllowedFiles: Math.floor(parsed) };
		} else {
			// Empty string means unlimited - we need to explicitly pass undefined
			metadataPayload = { maxAllowedFiles: undefined };
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const body: Record<string, unknown> = {
				username: user.username,
				role,
			};

			if (metadataPayload) {
				body.metadata = metadataPayload;
			}

			const response = await fetch("/api/users", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(body),
			});

			const payload = await response.json();

			if (!response.ok || !payload?.success) {
				const message = payload?.error || "Failed to update user.";
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
					: "Failed to update user.";
			setError(message);
			onError?.(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!user) {
		return null;
	}

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
							<div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
								<PencilSquareIcon className="h-8 w-8 text-white" />
							</div>
							<div>
								<Dialog.Title className="text-2xl font-bold gradient-text">
									Edit User
								</Dialog.Title>
								<Dialog.Description className="text-sm text-gray-600">
									Update role and quota for {user.username}
								</Dialog.Description>
							</div>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
							aria-label="Close edit user modal"
						>
							<XMarkIcon className="h-6 w-6" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-400 mb-2">
								Username
							</label>
							<div className="input-field bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200">
								{user.username}
							</div>
							<p className="text-xs text-gray-400 mt-2">
								Username cannot be changed
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
															? "bg-blue-50 text-blue-600"
															: "text-gray-700"
													}`
												}
											>
												{({ selected }) => (
													<>
														<span>{option}</span>
														{selected && (
															<CheckIcon className="h-4 w-4 text-blue-600" />
														)}
													</>
												)}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
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
										<span>Updating...</span>
									</>
								) : (
									<>
										<PencilSquareIcon className="h-5 w-5" />
										<span>Update user</span>
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

