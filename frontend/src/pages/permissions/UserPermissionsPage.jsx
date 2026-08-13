import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Save,
    Search,
    ShieldCheck,
    UserRound,
    UsersRound,
} from "lucide-react";

import api from "../../api/axios";

function getErrorMessage(
    requestError,
    fallback
) {
    const errors =
        requestError.response?.data?.errors;

    if (errors) {
        return Object.values(errors)
            .flat()[0];
    }

    return (
        requestError.response?.data
            ?.message ?? fallback
    );
}

function normalizePermissions(
    permissions
) {
    return [...permissions]
        .sort()
        .join("|");
}

async function requestAssignableUsers() {
    const allUsers = [];

    let page = 1;
    let lastPage;

    do {
        const response = await api.get(
            "/users",
            {
                params: {
                    page,
                    per_page: 100,
                },
            }
        );

        const body = response.data;

        const pagination =
            Array.isArray(body?.data)
                ? body
                : (body?.data ?? body);

        const pageUsers =
            Array.isArray(pagination)
                ? pagination
                : Array.isArray(
                        pagination?.data
                    )
                  ? pagination.data
                  : [];

        allUsers.push(
            ...pageUsers.filter((user) =>
                [
                    "responsable",
                    "fournisseur",
                ].includes(user.role)
            )
        );

        lastPage = Number(
            pagination?.last_page ?? 1
        );

        page += 1;
    } while (page <= lastPage);

    return allUsers;
}

function UserPermissionsPage() {
    const [users, setUsers] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [
        selectedUserId,
        setSelectedUserId,
    ] = useState("");

    const [
        selectedUser,
        setSelectedUser,
    ] = useState(null);

    const [
        permissionGroups,
        setPermissionGroups,
    ] = useState([]);

    const [
        selectedPermissions,
        setSelectedPermissions,
    ] = useState([]);

    const [
        savedPermissions,
        setSavedPermissions,
    ] = useState([]);

    const [
        loadingUsers,
        setLoadingUsers,
    ] = useState(true);

    const [
        loadingPermissions,
        setLoadingPermissions,
    ] = useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const permissionRequestId =
        useRef(0);

    const successTimer =
        useRef(null);

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            try {
                const data =
                    await requestAssignableUsers();

                if (!cancelled) {
                    setUsers(data);
                }
            } catch (requestError) {
                console.error(
                    requestError
                );

                if (!cancelled) {
                    setError(
                        "Unable to load users."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingUsers(false);
                }
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (
                successTimer.current
            ) {
                window.clearTimeout(
                    successTimer.current
                );
            }
        };
    }, []);

    const visibleUsers =
        useMemo(() => {
            const term = search
                .trim()
                .toLowerCase();

            if (!term) {
                return users;
            }

            return users.filter(
                (user) =>
                    [
                        user.name,
                        user.email,
                        user.role,
                    ]
                        .filter(Boolean)
                        .some((value) =>
                            value
                                .toLowerCase()
                                .includes(term)
                        )
            );
        }, [search, users]);

    const allPermissionNames =
        useMemo(
            () =>
                permissionGroups.flatMap(
                    (group) =>
                        group.permissions.map(
                            (
                                permission
                            ) =>
                                permission.name
                        )
                ),
            [permissionGroups]
        );

    const allPermissionsSelected =
        allPermissionNames.length > 0 &&
        allPermissionNames.every(
            (permission) =>
                selectedPermissions.includes(
                    permission
                )
        );

    const hasChanges =
        normalizePermissions(
            selectedPermissions
        ) !==
        normalizePermissions(
            savedPermissions
        );

    const selectedFeatureCount =
        permissionGroups.filter(
            (group) => {
                const groupNames =
                    group.permissions.map(
                        (permission) =>
                            permission.name
                    );

                return (
                    groupNames.length >
                        0 &&
                    groupNames.every(
                        (name) =>
                            selectedPermissions.includes(
                                name
                            )
                    )
                );
            }
        ).length;

    const displaySuccess = (
        message
    ) => {
        if (successTimer.current) {
            window.clearTimeout(
                successTimer.current
            );
        }

        setSuccess(message);

        successTimer.current =
            window.setTimeout(() => {
                setSuccess("");
            }, 3000);
    };

    const handleSelectUser = async (
        userId
    ) => {
        const normalizedId =
            String(userId);

        const requestId =
            permissionRequestId.current +
            1;

        permissionRequestId.current =
            requestId;

        setSelectedUserId(
            normalizedId
        );

        setSelectedUser(null);
        setPermissionGroups([]);
        setSelectedPermissions([]);
        setSavedPermissions([]);
        setError("");
        setSuccess("");

        if (!normalizedId) {
            return;
        }

        setLoadingPermissions(true);

        try {
            const response =
                await api.get(
                    `/admin/users/${normalizedId}/permissions`
                );

            if (
                permissionRequestId.current !==
                requestId
            ) {
                return;
            }

            const data =
                response.data.data ??
                response.data;

            const groups =
                Array.isArray(
                    data.available_permissions
                )
                    ? data.available_permissions
                    : [];

            const allowedNames =
                groups.flatMap(
                    (group) =>
                        group.permissions.map(
                            (
                                permission
                            ) =>
                                permission.name
                        )
                );

            const assigned =
                Array.isArray(
                    data.assigned_permissions
                )
                    ? data.assigned_permissions.filter(
                          (name) =>
                              allowedNames.includes(
                                name
                              )
                      )
                    : [];

            setSelectedUser(
                data.user ?? null
            );

            setPermissionGroups(
                groups
            );

            setSelectedPermissions(
                assigned
            );

            setSavedPermissions(
                assigned
            );
        } catch (requestError) {
            console.error(
                requestError
            );

            if (
                permissionRequestId.current ===
                requestId
            ) {
                setError(
                    getErrorMessage(
                        requestError,
                        "Unable to load user permissions."
                    )
                );
            }
        } finally {
            if (
                permissionRequestId.current ===
                requestId
            ) {
                setLoadingPermissions(
                    false
                );
            }
        }
    };

    const toggleGroup = (group) => {
        const groupNames =
            group.permissions.map(
                (permission) =>
                    permission.name
            );

        setSelectedPermissions(
            (current) => {
                const groupIsSelected =
                    groupNames.every(
                        (name) =>
                            current.includes(
                                name
                            )
                    );

                if (groupIsSelected) {
                    return current.filter(
                        (name) =>
                            !groupNames.includes(
                                name
                            )
                    );
                }

                return [
                    ...new Set([
                        ...current,
                        ...groupNames,
                    ]),
                ];
            }
        );
    };

    const toggleAllPermissions =
        () => {
            setSelectedPermissions(
                allPermissionsSelected
                    ? []
                    : allPermissionNames
            );
        };

    const handleSave = async () => {
        if (!selectedUser) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response =
                await api.put(
                    `/admin/users/${selectedUser.id}/permissions`,
                    {
                        permissions:
                            selectedPermissions,
                    }
                );

            const assigned =
                response.data.data
                    ?.assigned_permissions ??
                selectedPermissions;

            setSelectedPermissions(
                assigned
            );

            setSavedPermissions(
                assigned
            );

            displaySuccess(
                response.data
                    .message ??
                    "User permissions updated successfully."
            );
        } catch (requestError) {
            console.error(
                requestError
            );

            setError(
                getErrorMessage(
                    requestError,
                    "Unable to update user permissions."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                        <ShieldCheck
                            size={27}
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            User
                            permissions
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Give users
                            complete access
                            to the features
                            assigned to them.
                        </p>
                    </div>
                </div>

                {selectedUser && (
                    <button
                        type="button"
                        onClick={
                            handleSave
                        }
                        disabled={
                            saving ||
                            !hasChanges
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {saving ? (
                            <Loader2
                                size={
                                    18
                                }
                                className="animate-spin"
                            />
                        ) : (
                            <Save
                                size={
                                    18
                                }
                            />
                        )}

                        {saving
                            ? "Saving..."
                            : "Save permissions"}
                    </button>
                )}
            </div>

            {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2
                        size={18}
                    />

                    {success}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle
                        size={18}
                    />

                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5">
                        <div className="flex items-center gap-3">
                            <UsersRound
                                size={
                                    20
                                }
                                className="text-slate-600"
                            />

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Select
                                    a user
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Responsables
                                    and
                                    fournisseurs
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-4">
                            <Search
                                size={
                                    17
                                }
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search users..."
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                        </div>
                    </div>

                    <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
                        {loadingUsers ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                                <Loader2
                                    size={
                                        19
                                    }
                                    className="animate-spin"
                                />

                                Loading
                                users...
                            </div>
                        ) : visibleUsers.length ===
                          0 ? (
                            <div className="py-12 text-center text-sm text-slate-500">
                                No
                                assignable
                                users
                                found.
                            </div>
                        ) : (
                            visibleUsers.map(
                                (
                                    user
                                ) => {
                                    const selected =
                                        String(
                                            user.id
                                        ) ===
                                        selectedUserId;

                                    return (
                                        <button
                                            key={
                                                user.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleSelectUser(
                                                    user.id
                                                )
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                                selected
                                                    ? "border-blue-300 bg-blue-50 shadow-sm"
                                                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                    selected
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <UserRound
                                                    size={
                                                        18
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {
                                                        user.name
                                                    }
                                                </p>

                                                <p className="truncate text-xs text-slate-500">
                                                    {
                                                        user.email
                                                    }
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                                {
                                                    user.role
                                                }
                                            </span>
                                        </button>
                                    );
                                }
                            )
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {!selectedUserId ? (
                        <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <ShieldCheck
                                    size={
                                        30
                                    }
                                />
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-slate-900">
                                Choose a
                                user
                            </h2>

                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                Select a user
                                from the list
                                to view and
                                update their
                                permissions.
                            </p>
                        </div>
                    ) : loadingPermissions ? (
                        <div className="flex min-h-[500px] items-center justify-center gap-2 text-slate-500">
                            <Loader2
                                size={
                                    22
                                }
                                className="animate-spin"
                            />

                            Loading
                            permissions...
                        </div>
                    ) : selectedUser ? (
                        <>
                            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {
                                                selectedUser.name
                                            }
                                        </h2>

                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                                            {
                                                selectedUser.role
                                            }
                                        </span>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                selectedUser.status ===
                                                "active"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {
                                                selectedUser.status
                                            }
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {
                                            selectedUser.email
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        toggleAllPermissions
                                    }
                                    disabled={
                                        allPermissionNames.length ===
                                        0
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    {allPermissionsSelected
                                        ? "Clear all"
                                        : "Select all"}
                                </button>
                            </div>

                            <div className="space-y-4 p-5">
                                {permissionGroups.length ===
                                0 ? (
                                    <div className="py-14 text-center text-sm text-slate-500">
                                        No
                                        permissions
                                        are
                                        configured
                                        for this
                                        role.
                                    </div>
                                ) : (
                                    permissionGroups.map(
                                        (
                                            group
                                        ) => {
                                            const groupNames =
                                                group.permissions.map(
                                                    (
                                                        permission
                                                    ) =>
                                                        permission.name
                                                );

                                            const selectedCount =
                                                groupNames.filter(
                                                    (
                                                        name
                                                    ) =>
                                                        selectedPermissions.includes(
                                                            name
                                                        )
                                                )
                                                    .length;

                                            const groupSelected =
                                                groupNames.length >
                                                    0 &&
                                                selectedCount ===
                                                    groupNames.length;

                                            const partiallySelected =
                                                selectedCount >
                                                    0 &&
                                                !groupSelected;

                                            return (
                                                <label
                                                    key={
                                                        group.feature ??
                                                        group.label
                                                    }
                                                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                                                        groupSelected
                                                            ? "border-blue-300 bg-blue-50 shadow-sm"
                                                            : partiallySelected
                                                              ? "border-amber-300 bg-amber-50"
                                                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            groupSelected
                                                        }
                                                        onChange={() =>
                                                            toggleGroup(
                                                                group
                                                            )
                                                        }
                                                        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <h3 className="font-semibold text-slate-900">
                                                                {
                                                                    group.label
                                                                }
                                                            </h3>

                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                    groupSelected
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : partiallySelected
                                                                          ? "bg-amber-100 text-amber-700"
                                                                          : "bg-slate-100 text-slate-600"
                                                                }`}
                                                            >
                                                                {groupSelected
                                                                    ? "Full access"
                                                                    : partiallySelected
                                                                      ? "Partial access"
                                                                      : "No access"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {groupSelected
                                                                ? "The user can view and manage this feature."
                                                                : partiallySelected
                                                                  ? "Select this feature to grant all its permissions."
                                                                  : "Select this feature to grant complete access."}
                                                        </p>

                                                        <p className="mt-2 text-xs text-slate-400">
                                                            Includes{" "}
                                                            {
                                                                groupNames.length
                                                            }{" "}
                                                            permission
                                                            {groupNames.length ===
                                                            1
                                                                ? ""
                                                                : "s"}
                                                            .
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        }
                                    )
                                )}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    {
                                        selectedFeatureCount
                                    }{" "}
                                    feature(s)
                                    selected

                                    {hasChanges && (
                                        <span className="ml-2 font-semibold text-amber-600">
                                            Unsaved
                                            changes
                                        </span>
                                    )}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        handleSave
                                    }
                                    disabled={
                                        saving ||
                                        !hasChanges
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {saving ? (
                                        <Loader2
                                            size={
                                                17
                                            }
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save
                                            size={
                                                17
                                            }
                                        />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : "Save permissions"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[500px] items-center justify-center text-sm text-slate-500">
                            Unable to display
                            this user.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default UserPermissionsPage;
