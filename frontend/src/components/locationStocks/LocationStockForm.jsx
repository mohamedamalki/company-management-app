import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Warehouse } from "lucide-react";
import api from "../../api/axios";

const initialForm = {
  location_id: "",
  product_id: "",
  minimum_quantity: "0",
};

function getResponseData(response) {
  return response.data.data ?? response.data;
}

function LocationStockForm({
  onSubmit,
  saving = false,
  error = "",
  submitText = "Initialize stock",
}) {
  const [formData, setFormData] = useState(initialForm);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/location-stocks/options")
      .then((response) => {
        if (cancelled) return;

        const data = getResponseData(response);

        setLocations(Array.isArray(data?.locations) ? data.locations : []);
        setProducts(Array.isArray(data?.products) ? data.products : []);
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!cancelled) {
          setOptionsError(
            requestError.response?.data?.message ??
              "Unable to load locations and products.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      location_id: Number(formData.location_id),
      product_id: Number(formData.product_id),
      minimum_quantity: Number(formData.minimum_quantity),
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
          <Warehouse size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Initialize location stock
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign a product to a location and configure its low-stock
            threshold.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {(error || optionsError) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error || optionsError}
          </div>
        )}

        {loadingOptions ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Loading form options...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
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
                className={inputClass}
                disabled={saving}
                required
              >
                <option value="">Select a location</option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                    {location.type ? ` - ${location.type}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="product_id"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Product <span className="text-red-500">*</span>
              </label>

              <select
                id="product_id"
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className={inputClass}
                disabled={saving}
                required
              >
                <option value="">Select a product</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.reference ? ` - ${product.reference}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="minimum_quantity"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Minimum quantity <span className="text-red-500">*</span>
              </label>

              <input
                id="minimum_quantity"
                type="number"
                name="minimum_quantity"
                value={formData.minimum_quantity}
                onChange={handleChange}
                min="0"
                step="0.001"
                className={inputClass}
                disabled={saving}
                required
              />

              <p className="mt-1.5 text-xs text-slate-500">
                The product is marked as low stock when its quantity reaches
                this value.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to="/app/location-stocks"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving || loadingOptions || Boolean(optionsError)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default LocationStockForm;
