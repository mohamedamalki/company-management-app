import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Plus, Save, Trash2 } from "lucide-react";
import api from "../../api/axios";

const localToday = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const emptyItem = () => ({
  product_id: "",
  quantity: "1",
  unit_price_ht: "",
  tax_rate: "20",
});

const emptyOrder = {
  supplier_id: "",
  location_id: "",
  order_date: localToday(),
  expected_date: "",
  notes: "",
  items: [emptyItem()],
};

const createInitialForm = (initialData = emptyOrder) => ({
  ...emptyOrder,
  ...initialData,
  supplier_id: initialData?.supplier_id ?? "",
  location_id: initialData?.location_id ?? "",
  expected_date: initialData?.expected_date ?? "",
  notes: initialData?.notes ?? "",
  items: initialData?.items?.length
    ? initialData.items.map((item) => ({
        product_id: item.product_id ?? "",
        quantity: item.quantity ?? "1",
        unit_price_ht: item.unit_price_ht ?? "",
        tax_rate: item.tax_rate ?? "20",
      }))
    : [emptyItem()],
});

const extractRows = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

async function fetchEveryPage(endpoint, params = {}) {
  let page = 1;
  const rows = [];

  while (true) {
    const response = await api.get(endpoint, {
      params: { ...params, page, per_page: 100 },
    });
    const body = response.data;
    const lastPage = Number(body?.last_page ?? 1);

    rows.push(...extractRows(body));

    if (page >= lastPage) {
      break;
    }

    page += 1;
  }

  return rows;
}

const formatMoney = (value) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

function PurchaseOrderForm({
  initialData = emptyOrder,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save order",
}) {
  const [formData, setFormData] = useState(() =>
    createInitialForm(initialData),
  );
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [supplierResult, locationResult, productResult, taxResult] =
          await Promise.all([
            api.get("/suppliers/active"),
            fetchEveryPage("/locations", { status: "active" }),
            fetchEveryPage("/products"),
            api.get("/tax-rates/active"),
          ]);

        if (cancelled) return;

        const supplierRows = extractRows(supplierResult.data);
        const locationRows = locationResult;
        const productRows = productResult;
        const taxRows = extractRows(taxResult.data);

        // Keep existing selections visible while editing old orders.
        if (
          initialData?.supplier &&
          !supplierRows.some((item) => item.id === initialData.supplier.id)
        ) {
          supplierRows.push(initialData.supplier);
        }
        if (
          initialData?.location &&
          !locationRows.some((item) => item.id === initialData.location.id)
        ) {
          locationRows.push(initialData.location);
        }

        setSuppliers(supplierRows);
        setLocations(locationRows);
        setProducts(productRows);
        setTaxRates(taxRows);
      } catch (requestError) {
        console.error(requestError);
        if (!cancelled) {
          setOptionsError(
            requestError.response?.data?.message ??
              "Unable to load suppliers, locations, products or TVA rates.",
          );
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const totals = useMemo(() => {
    return formData.items.reduce(
      (result, item) => {
        const lineHt =
          Number(item.quantity || 0) * Number(item.unit_price_ht || 0);
        const lineTax = (lineHt * Number(item.tax_rate || 0)) / 100;

        return {
          subtotalHt: result.subtotalHt + lineHt,
          taxAmount: result.taxAmount + lineTax,
          totalTtc: result.totalTtc + lineHt + lineTax,
        };
      },
      { subtotalHt: 0, taxAmount: 0, totalTtc: 0 },
    );
  }, [formData.items]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setFormData((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      supplier_id: Number(formData.supplier_id),
      location_id: Number(formData.location_id),
      order_date: formData.order_date,
      expected_date: formData.expected_date || null,
      notes: formData.notes || null,
      items: formData.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        unit_price_ht: Number(item.unit_price_ht),
        tax_rate: Number(item.tax_rate),
      })),
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="rounded-xl bg-slate-900 p-3 text-white">
          <ClipboardList size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Purchase order information
          </h2>
          <p className="text-sm text-slate-500">
            Select the supplier, destination and ordered products.
          </p>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {(error || optionsError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || optionsError}
          </div>
        )}

        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Assignment and dates
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>
                Supplier <span className="text-red-500">*</span>
              </span>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleFieldChange}
                className={inputClass}
                disabled={optionsLoading}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} — {supplier.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>
                Destination <span className="text-red-500">*</span>
              </span>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleFieldChange}
                className={inputClass}
                disabled={optionsLoading}
                required
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} — {location.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} /> Order date
                <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleFieldChange}
                className={inputClass}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Expected delivery date</span>
              <input
                type="date"
                name="expected_date"
                min={formData.order_date}
                value={formData.expected_date}
                onChange={handleFieldChange}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Products
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Laravel will calculate and verify the final totals.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus size={17} /> Add product
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => {
              const lineHt =
                Number(item.quantity || 0) * Number(item.unit_price_ht || 0);
              const lineTtc = lineHt * (1 + Number(item.tax_rate || 0) / 100);

              return (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[2fr_0.7fr_1fr_0.8fr_1fr_auto] lg:items-end"
                >
                  <label className="space-y-2 text-xs font-semibold text-slate-600">
                    <span>Product *</span>
                    <select
                      value={item.product_id}
                      onChange={(event) =>
                        handleItemChange(
                          index,
                          "product_id",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                          {product.reference ? ` — ${product.reference}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-xs font-semibold text-slate-600">
                    <span>Quantity *</span>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={item.quantity}
                      onChange={(event) =>
                        handleItemChange(index, "quantity", event.target.value)
                      }
                      className={inputClass}
                      required
                    />
                  </label>

                  <label className="space-y-2 text-xs font-semibold text-slate-600">
                    <span>Unit price HT *</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price_ht}
                      onChange={(event) =>
                        handleItemChange(
                          index,
                          "unit_price_ht",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="0.00"
                      required
                    />
                  </label>

                  <label className="space-y-2 text-xs font-semibold text-slate-600">
                    <span>TVA *</span>
                    <select
                      value={item.tax_rate}
                      onChange={(event) =>
                        handleItemChange(index, "tax_rate", event.target.value)
                      }
                      className={inputClass}
                      required
                    >
                      {taxRates.length === 0 && <option value="20">20%</option>}
                      {taxRates.map((rate) => (
                        <option key={rate.id} value={rate.rate}>
                          {rate.name} ({Number(rate.rate)}%)
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      Line TTC
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900">
                      {formatMoney(lineTtc)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    title="Remove product"
                    className="rounded-xl border border-red-200 bg-white p-2.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Notes</span>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFieldChange}
              className={inputClass}
              rows="5"
              placeholder="Delivery instructions or additional information..."
            />
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-600">
              Order preview
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal HT</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(totals.subtotalHt)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(totals.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-3 text-base font-bold text-blue-700">
                <span>Total TTC</span>
                <span>{formatMoney(totals.totalTtc)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
        <Link
          to="/app/purchase-orders"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || optionsLoading || optionsError !== ""}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default PurchaseOrderForm;
