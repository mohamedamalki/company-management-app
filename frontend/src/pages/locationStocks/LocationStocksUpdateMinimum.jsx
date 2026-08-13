import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import api from "../../api/axios";

function getErrorMessage(error, fallback) {
  const errors = error.response?.data?.errors;

  if (errors) {
    return Object.values(errors).flat()[0];
  }

  return error.response?.data?.message ?? fallback;
}

function LocationStocksUpdateMinimum() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/location-stocks/${id}`)
      .then((response) => {
        if (cancelled) return;

        const data = response.data.data ?? response.data;

        setStock(data);
        setMinimumQuantity(data.minimum_quantity ?? "0");
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!cancelled) {
          setError(
            getErrorMessage(requestError, "Unable to load location stock."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.patch(`/location-stocks/${id}/minimum-quantity`, {
        minimum_quantity: Number(minimumQuantity),
      });

      navigate("/app/location-stocks", {
        replace: true,
        state: {
          message: "Minimum quantity updated successfully.",
        },
      });
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to update minimum quantity."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin" size={22} />
        Loading stock...
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Location stock not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Update minimum quantity
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure the low-stock warning level for this product.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={21} />
          </span>

          <div>
            <h2 className="font-bold text-slate-900">
              {stock.product?.name ?? "Product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {stock.location?.name ?? "Location"}
              {stock.location?.code ? ` (${stock.location.code})` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current quantity
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {Number(stock.quantity).toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                {stock.product?.unit ?? ""}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current status
              </p>
              <p className="mt-1 text-lg font-bold capitalize text-slate-900">
                {(stock.stock_status ?? "").replaceAll("_", " ")}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="minimum_quantity"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Minimum quantity <span className="text-red-500">*</span>
            </label>

            <input
              id="minimum_quantity"
              type="number"
              value={minimumQuantity}
              onChange={(event) => setMinimumQuantity(event.target.value)}
              min="0"
              step="0.001"
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100"
              required
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            to="/app/location-stocks"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving && <Loader2 size={17} className="animate-spin" />}
            {saving ? "Saving..." : "Update minimum"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LocationStocksUpdateMinimum;
