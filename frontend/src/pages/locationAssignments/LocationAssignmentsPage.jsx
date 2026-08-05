import { useEffect, useState } from "react";
import {
  Link2,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Search,
  Unlink,
  Users,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
  user_id: "",
  location_id: "",
};

const initialPagination = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
}

function extractPagination(payload) {
  const paginator = Array.isArray(payload?.data)
    ? payload
    : (payload?.data ?? payload);

  return {
    items: extractList(paginator),
    pagination: {
      currentPage: paginator?.current_page ?? 1,
      lastPage: paginator?.last_page ?? 1,
      total: paginator?.total ?? extractList(paginator).length,
    },
  };
}

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors).flat()[0];
  }

  return error.response?.data?.message ?? fallback;
}

function roleClass(role) {
  const classes = {
    admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
    responsable: "bg-blue-50 text-blue-700 ring-blue-600/20",
    fournisseur: "bg-amber-50 text-amber-700 ring-amber-600/20",
  };

  return classes[role] ?? "bg-slate-50 text-slate-700 ring-slate-600/20";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function LocationAssignmentsPage() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) {
        return;
    }

    const timeoutId = setTimeout(() => {
        setSuccess("");
    }, 3000);

    return () => {
        clearTimeout(timeoutId);
    };
}, [success]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [usersResponse, locationsResponse, assignmentsResponse] =
          await Promise.all([
            api.get("/users", {
              params: {
                status: "active",
                per_page: 100,
              },
            }),
            api.get("/locations", {
              params: {
                status: "active",
                per_page: 100,
              },
            }),
            api.get("/location-assignments"),
          ]);

        if (cancelled) {
          return;
        }

        const assignmentResult = extractPagination(assignmentsResponse.data);

        setUsers(extractList(usersResponse.data));
        setLocations(extractList(locationsResponse.data));
        setAssignments(assignmentResult.items);
        setPagination(assignmentResult.pagination);
      } catch (error) {
        if (!cancelled) {
          setError(
            getErrorMessage(error, "Unable to load location assignments."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAssignments = async (page = 1, search = activeSearch) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/location-assignments", {
        params: {
          page,
          ...(search ? { search } : {}),
        },
      });

      const result = extractPagination(response.data);

      setAssignments(result.items);
      setPagination(result.pagination);
    } catch (error) {
      setError(getErrorMessage(error, "Unable to load location assignments."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.post("/location-assignments", formData);

      setSuccess(response.data?.message ?? "Location assigned successfully.");

      resetForm();
      await loadAssignments(1, activeSearch);
    } catch (error) {
      setError(
        getErrorMessage(error, "Unable to save the location assignment."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      user_id: String(assignment.user_id),
      location_id: String(assignment.location_id),
    });

    setEditingId(assignment.id);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Remove ${assignment.user?.name ?? "this user"} from their location?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(assignment.id);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/location-assignments/${assignment.id}`,
      );

      setSuccess(
        response.data?.message ?? "Location assignment removed successfully.",
      );

      if (editingId === assignment.id) {
        resetForm();
      }

      const targetPage =
        assignments.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;

      await loadAssignments(targetPage, activeSearch);
    } catch (error) {
      setError(
        getErrorMessage(error, "Unable to remove the location assignment."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    const search = searchInput.trim();

    setActiveSearch(search);
    await loadAssignments(1, search);
  };

  const handleClearSearch = async () => {
    setSearchInput("");
    setActiveSearch("");
    await loadAssignments(1, "");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Link2 size={16} />
              Access and assignment
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Location assignments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Choose where each admin, responsable, or fournisseur works.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Assigned</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {pagination.total}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Users</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {users.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Locations</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {locations.length}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm shadow-blue-600/20">
                <MapPin size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingId ? "Change assigned location" : "Assign a user"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  If the user already has a location, their assignment will be
                  updated.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
          >
            <div>
              <label
                htmlFor="user_id"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                User <span className="text-red-500">*</span>
              </label>

              <select
                id="user_id"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                disabled={Boolean(editingId)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select a user</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location_id"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Location <span className="text-red-500">*</span>
              </label>

              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Select a location</option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code}) — {location.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !formData.user_id || !formData.location_id}
                className="inline-flex min-w-36 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Link2 size={17} />
                )}

                {saving ? "Saving..." : editingId ? "Update" : "Assign"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
                  title="Cancel editing"
                >
                  <RotateCcw size={17} />
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Users size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Assigned users</h2>
                <p className="text-xs text-slate-500">
                  {pagination.total} assignment
                  {pagination.total === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex w-full gap-2 sm:w-auto"
            >
              <div className="relative min-w-0 flex-1 sm:w-72">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search user or location..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>

              {activeSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Location</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Assigned at</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center">
                      <Loader2
                        size={24}
                        className="mx-auto animate-spin text-blue-600"
                      />
                      <p className="mt-2 text-slate-500">
                        Loading assignments...
                      </p>
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center">
                      <MapPin size={30} className="mx-auto text-slate-300" />
                      <p className="mt-3 font-medium text-slate-700">
                        No assignments found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Assign a user using the form above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {assignment.user?.name ?? "Unknown user"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {assignment.user?.email ?? "-"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${roleClass(
                            assignment.user?.role,
                          )}`}
                        >
                          {assignment.user?.role ?? "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />
                          <div>
                            <p className="font-medium text-slate-800">
                              {assignment.location?.name ?? "Unknown location"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {assignment.location?.code ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                          {assignment.location?.type ?? "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {formatDate(assignment.assigned_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(assignment)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                            Change
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(assignment)}
                            disabled={deletingId === assignment.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === assignment.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Unlink size={14} />
                            )}
                            Unassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-6">
              <p className="text-sm text-slate-500">
                Page {pagination.currentPage} of {pagination.lastPage}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadAssignments(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => loadAssignments(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default LocationAssignmentsPage;
