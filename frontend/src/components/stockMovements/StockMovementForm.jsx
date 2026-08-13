import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  PackageOpen,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
  location_stock_id: "",
  type: "opening_stock",
  quantity: "",
  notes: "",
};

const movementTypes = [
  {
    value: "opening_stock",
    label: "Opening stock",
    description: "Record the first physical quantity for this product.",
  },
  {
    value: "adjustment_in",
    label: "Stock adjustment in",
    description: "Add quantity after a verified stock correction.",
  },
  {
    value: "adjustment_out",
    label: "Stock adjustment out",
    description: "Remove quantity after a verified stock correction.",
  },
];

function formatQuantity(value) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function StockMovementForm({
  onSubmit,
  saving = false,
  error = "",
  submitText = "Record movement",
}) {
  const [formData, setFormData] = useState(initialForm);
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [stocksError, setStocksError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/location-stocks", {
        params: { per_page: 100 },
      })
      .then((response) => {
        if (cancelled) return;

        const body = response.data;
        const data = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

        setStocks(data);
        setStocksError("");
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!cancelled) {
          setStocksError(
            requestError.response?.data?.message ??
              "Unable to load initialized stocks.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStocks(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStock = useMemo(
    () =>
      stocks.find((stock) => String(stock.id) === formData.location_stock_id) ??
      null,
    [formData.location_stock_id, stocks],
  );

  const currentQuantity = Number(selectedStock?.quantity ?? 0);
  const enteredQuantity = Number(formData.quantity || 0);
  const isExit = formData.type === "adjustment_out";
  const quantityAfter = isExit
    ? currentQuantity - enteredQuantity
    : currentQuantity + enteredQuantity;
  const requiresNotes = formData.type !== "opening_stock";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "location_stock_id" &&
      current.type === "opening_stock" &&
      Number(
        stocks.find((stock) => String(stock.id) === value)?.quantity ?? 0,
      ) !== 0
        ? { type: "adjustment_in" }
        : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedStock) return;

    onSubmit({
      location_id: Number(selectedStock.location_id),
      product_id: Number(selectedStock.product_id),
      type: formData.type,
      quantity: Number(formData.quantity),
      notes: formData.notes.trim() || null,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <PackageOpen size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Manual stock movement
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Record an opening quantity or a verified manual correction.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {(error || stocksError) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error || stocksError}
          </div>
        )}

        {loadingStocks ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Loading initialized stocks...
          </div>
        ) : stocks.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <p className="font-semibold">No initialized stock is available.</p>
            <p className="mt-1">
              Initialize a product in a location before recording its quantity.
            </p>
            <Link
              to="/app/location-stocks/create"
              className="mt-3 inline-flex font-bold text-amber-900 underline"
            >
              Initialize stock
            </Link>
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="location_stock_id"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Product and location <span className="text-red-500">*</span>
              </label>

              <select
                id="location_stock_id"
                name="location_stock_id"
                value={formData.location_stock_id}
                onChange={handleChange}
                className={inputClass}
                disabled={saving}
                required
              >
                <option value="">Select initialized stock</option>

                {stocks.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.product?.name ?? "Unknown product"}
                    {stock.product?.reference
                      ? ` (${stock.product.reference})`
                      : ""}
                    {` — ${stock.location?.name ?? "Unknown location"}`}
                    {stock.location?.code ? ` [${stock.location.code}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Movement type <span className="text-red-500">*</span>
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                {movementTypes.map((movementType) => {
                  const checked = formData.type === movementType.value;
                  const disabled =
                    movementType.value === "opening_stock" &&
                    selectedStock &&
                    currentQuantity !== 0;

                  return (
                    <label
                      key={movementType.value}
                      className={`rounded-xl border p-4 transition ${
                        checked
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="type"
                          value={movementType.value}
                          checked={checked}
                          onChange={handleChange}
                          disabled={saving || Boolean(disabled)}
                        />
                        <span className="text-sm font-bold text-slate-800">
                          {movementType.label}
                        </span>
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {movementType.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0.001"
                    step="0.001"
                    placeholder="0.000"
                    className={`${inputClass} pr-20`}
                    disabled={saving}
                    required
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {selectedStock?.product?.unit ?? "unit"}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Notes{" "}
                  {requiresNotes && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="notes"
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder="Reason for this stock movement"
                  className={inputClass}
                  disabled={saving}
                  required={requiresNotes}
                />
              </div>
            </div>

            {selectedStock && (
              <div
                className={`grid gap-4 rounded-xl border p-4 sm:grid-cols-3 ${
                  quantityAfter < 0
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Current quantity
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatQuantity(currentQuantity)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Movement
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1 text-lg font-bold ${
                      isExit ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {isExit ? (
                      <ArrowUpFromLine size={18} />
                    ) : (
                      <ArrowDownToLine size={18} />
                    )}
                    {isExit ? "−" : "+"}
                    {formatQuantity(enteredQuantity)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Quantity after
                  </p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      quantityAfter < 0 ? "text-red-700" : "text-blue-700"
                    }`}
                  >
                    {formatQuantity(quantityAfter)}
                  </p>
                </div>

                {quantityAfter < 0 && (
                  <p className="text-sm font-semibold text-red-700 sm:col-span-3">
                    The outgoing quantity cannot exceed the available stock.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to="/app/stock-movements"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            saving ||
            loadingStocks ||
            Boolean(stocksError) ||
            stocks.length === 0 ||
            !selectedStock ||
            !formData.quantity ||
            quantityAfter < 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default StockMovementForm;
