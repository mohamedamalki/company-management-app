import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, Edit3, Plus, Power } from "lucide-react";
import api from "../../api/axios";

function SuppliersPage() {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message ?? "");
  const [changingId, setChangingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadSuppliers = async () => {
      try {
        const response = await api.get("/suppliers", {
          params: { page },
        });
        const body = response.data;

        if (!cancelled) {
          setSuppliers(Array.isArray(body.data) ? body.data : []);
          setMeta(body);
        }
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setError("Unable to load suppliers.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

    const handleStatus = async (supplier) => {
        const newStatus = !supplier.is_active;

    try {
        setChangingId(supplier.id);
        setError("");

        await api.patch(`/suppliers/${supplier.id}`, {
            is_active: newStatus,
        });

        setSuppliers((current) =>
            current.map((item) =>
                item.id === supplier.id
                    ? {
                          ...item,
                          is_active: newStatus,
                      }
                    : item
            )
        );
    } catch (error) {
        setError(
            error.response?.data?.message ??
                "Unable to change supplier status."
        );
    } finally {
        setChangingId(null);
    }
};

  const changePage = (newPage) => {
    setLoading(true);
    setError("");
    setPage(newPage);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <Building2 size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
            <p className="text-sm text-slate-500">
              Manage companies that supply your products.
            </p>
          </div>
        </div>

        <Link
          to="/admin/suppliers/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus size={18} /> Create supplier
        </Link>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">ICE</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {supplier.name}
                      </p>
                      <p className="text-xs text-slate-500">{supplier.code}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p>{supplier.contact_name || "-"}</p>
                      <p className="text-xs text-slate-400">
                        {supplier.email || ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {supplier.phone || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {supplier.ice || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          supplier.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {supplier.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/suppliers/${supplier.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 size={15} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleStatus(supplier)}
                          disabled={changingId === supplier.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                        >
                          <Power size={15} />
                          {supplier.is_active ? "Disable" : "Activate"}
                        </button>
                      </div>
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
              {meta.total ?? suppliers.length} suppliers
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!meta.prev_page_url}
                onClick={() => changePage(page - 1)}
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
                onClick={() => changePage(page + 1)}
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

export default SuppliersPage;
