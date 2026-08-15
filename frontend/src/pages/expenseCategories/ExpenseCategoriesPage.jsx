import { Edit3, FolderCog, Plus, Power } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

function extractError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function ExpenseCategoriesPage() {
  const routeLocation = useLocation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("expense-categories.manage");

  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(routeLocation.state?.message ?? "");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/expense-categories", {
        params: { page },
        signal: controller.signal,
      })
      .then((response) => {
        const body = response.data;
        setCategories(Array.isArray(body.data) ? body.data : []);
        setMeta(body);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            extractError(requestError, "Unable to load expense categories."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, reloadKey]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const handleStatus = async (category) => {
    try {
      setChangingId(category.id);
      setError("");

      await api.put(`/expense-categories/${category.id}`, {
        is_active: !category.is_active,
      });

      setMessage(
        category.is_active
          ? "Expense category disabled successfully."
          : "Expense category activated successfully.",
      );
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(extractError(requestError, "Unable to change category status."));
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <FolderCog size={25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expense categories
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Organize every operational bill into a consistent category.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/expense-categories/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={18} /> Create category
          </Link>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Expenses</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    Loading expense categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    No expense categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {category.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {category.code}
                      </p>
                    </td>
                    <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                      <p className="line-clamp-2">
                        {category.description || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {category.expenses_count ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          category.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/app/expense-categories/${category.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Edit3 size={15} /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleStatus(category)}
                            disabled={changingId === category.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                          >
                            <Power size={15} />
                            {category.is_active ? "Disable" : "Activate"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
            <span className="text-slate-500">
              {meta.total ?? categories.length} categories
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!meta.prev_page_url}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {meta.current_page ?? 1} of {meta.last_page ?? 1}
              </span>
              <button
                type="button"
                disabled={!meta.next_page_url}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseCategoriesPage;
