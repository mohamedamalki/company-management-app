import {
  CalendarClock,
  CreditCard,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function emptyItem() {
  return {
    product_id: "",
    quantity: "1",
    discount_amount: "0",
  };
}

function getCurrentPrice(product) {
  return (
    product?.current_global_price ??
    product?.currentGlobalPrice ??
    product?.price ??
    null
  );
}

function getUnitPrice(product, quantity) {
  const price = getCurrentPrice(product);

  if (!price) {
    return 0;
  }

  const tiers = Array.isArray(price.tiers) ? [...price.tiers] : [];

  const matchingTier = tiers
    .filter((tier) => Number(tier.min_quantity) <= Number(quantity))
    .sort(
      (first, second) =>
        Number(second.min_quantity) - Number(first.min_quantity),
    )[0];

  return Number(matchingTier?.unit_price_ht ?? price.sale_price_ht ?? 0);
}

function getTaxRate(product) {
  const price = getCurrentPrice(product);

  return Number(price?.tax_rate?.rate ?? price?.taxRate?.rate ?? 0);
}

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeBoolean(value, fallback = true) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value === true || value === 1 || value === "1";
}

function SaleForm({
  initialData = null,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save sale",
}) {
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState(() => ({
    customer_id: initialData?.customer_id ?? "",

    location_id: initialData?.location_id ?? "",

    notes: initialData?.notes ?? "",

    apply_tax: normalizeBoolean(initialData?.apply_tax, true),

    tax_exemption_reason: initialData?.tax_exemption_reason ?? "",

    payment_method_id: "",
    payment_reference: "",
    paid_amount: String(initialData?.paid_amount ?? 0),

    items: initialData?.items?.length
      ? initialData.items.map((item) => ({
          product_id: String(item.product_id),

          quantity: String(item.quantity),

          discount_amount: String(item.discount_amount ?? 0),
        }))
      : [emptyItem()],
  }));

  const [options, setOptions] = useState({
    locations: [],
    customers: [],
    products: [],
    payment_methods: [],
  });

  const [loadingOptions, setLoadingOptions] = useState(true);

  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setOptionsError("");

        const response = await api.get("/sales/options", {
          params: {
            location_id: formData.location_id || undefined,
          },
        });

        if (cancelled) {
          return;
        }

        const data = response.data.data ?? {};

        setOptions({
          locations: data.locations ?? [],
          customers: data.customers ?? [],
          products: data.products ?? [],
          payment_methods: data.payment_methods ?? [],
        });
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setOptionsError(
            requestError.response?.data?.message ??
              "Unable to load sale options.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [formData.location_id]);

  const selectedPaymentMethod = options.payment_methods.find(
    (paymentMethod) =>
      String(paymentMethod.id) === String(formData.payment_method_id),
  );

  const requiresPaymentReference =
    selectedPaymentMethod?.requires_reference === true ||
    Number(selectedPaymentMethod?.requires_reference) === 1;

  const totals = useMemo(() => {
    return formData.items.reduce(
      (result, item) => {
        const product = options.products.find(
          (productOption) =>
            String(productOption.id) === String(item.product_id),
        );

        const quantity = Math.max(Number(item.quantity) || 0, 0);

        const unitPrice = getUnitPrice(product, quantity);

        const gross = unitPrice * quantity;

        const requestedDiscount = Math.max(
          Number(item.discount_amount || 0),
          0,
        );

        const discount = Math.min(requestedDiscount, gross);

        const totalHt = gross - discount;

        const taxRate = formData.apply_tax ? getTaxRate(product) : 0;

        const tax = (totalHt * taxRate) / 100;

        result.subtotal += gross;
        result.discount += discount;
        result.tax += tax;
        result.total += totalHt + tax;

        return result;
      },
      {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    );
  }, [formData.items, formData.apply_tax, options.products]);

  // Both walk-in and fournisseur sales can be unpaid or partially paid.
  const paidAmount = Math.max(Number(formData.paid_amount) || 0, 0);

  const remainingAmount = Math.max(totals.total - paidAmount, 0);

  const hasPayment = paidAmount > 0;

  const paidAmountIsTooHigh = paidAmount > totals.total;

  const getProduct = (productId) => {
    return options.products.find(
      (product) => String(product.id) === String(productId),
    );
  };

  const handleField = (event) => {
    const { name, value } = event.target;

    if (name === "customer_id") {
      setFormData((current) => ({
        ...current,
        customer_id: value,
        paid_amount: "0",
        payment_method_id: "",
        payment_reference: "",
      }));

      return;
    }

    if (name === "apply_tax") {
      const applyTax = value === "1";

      setFormData((current) => ({
        ...current,
        apply_tax: applyTax,
        tax_exemption_reason: applyTax ? "" : current.tax_exemption_reason,
      }));

      return;
    }

    if (name === "location_id") {
      setLoadingOptions(true);

      setFormData((current) => ({
        ...current,
        location_id: value,

        // Products depend on location stock.
        items: [emptyItem()],
      }));

      return;
    }

    if (name === "payment_method_id") {
      setFormData((current) => ({
        ...current,
        payment_method_id: value,
        payment_reference: "",
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData((current) => ({
      ...current,

      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
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

    const payload = {
      customer_id: formData.customer_id ? Number(formData.customer_id) : null,

      location_id: Number(formData.location_id),

      notes: formData.notes.trim() || null,

      apply_tax: formData.apply_tax,

      tax_exemption_reason: formData.apply_tax
        ? null
        : formData.tax_exemption_reason.trim(),

      items: formData.items.map((item) => ({
        product_id: Number(item.product_id),

        quantity: Number(item.quantity),

        discount_amount: Number(item.discount_amount || 0),
      })),
    };

    if (!isEditing) {
      payload.paid_amount = Number(paidAmount.toFixed(2));

      payload.payment_method_id = hasPayment
        ? Number(formData.payment_method_id)
        : null;

      payload.payment_reference = hasPayment
        ? formData.payment_reference.trim() || null
        : null;
    }

    onSubmit(payload);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
          <ShoppingCart size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Update sale" : "New sale"}
          </h2>

          <p className="text-sm text-slate-500">
            Customer is optional for ordinary supermarket sales.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {(error || optionsError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || optionsError}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="location_id"
              className="mb-1 block text-sm font-semibold"
            >
              Location
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleField}
              className={inputClass}
              disabled={saving}
              required
            >
              <option value="">Select location</option>

              {options.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} — {location.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="customer_id"
              className="mb-1 block text-sm font-semibold"
            >
              Customer
            </label>

            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleField}
              className={inputClass}
              disabled={saving}
            >
              <option value="">Walk-in customer</option>

              {options.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Sale date
            </label>

            <div className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
              <CalendarClock size={17} className="text-slate-400" />

              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(
                initialData?.sale_date
                  ? new Date(initialData.sale_date)
                  : new Date(),
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Recorded automatically when the sale is completed.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <label
                htmlFor="apply_tax"
                className="block text-sm font-bold text-slate-900"
              >
                TVA application
              </label>

              <p className="mt-1 text-sm text-slate-500">
                Choose whether TVA should be calculated for this sale.
              </p>
            </div>

            <select
              id="apply_tax"
              name="apply_tax"
              value={formData.apply_tax ? "1" : "0"}
              onChange={handleField}
              disabled={saving}
              className="w-full rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100 md:w-56"
            >
              <option value="1">With TVA</option>
              <option value="0">Without TVA</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[950px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>

                <th className="px-4 py-3">Stock</th>

                <th className="px-4 py-3">Quantity</th>

                <th className="px-4 py-3">Price HT</th>

                <th className="px-4 py-3">Discount</th>

                <th className="px-4 py-3">TVA</th>

                <th className="px-4 py-3">
                  {formData.apply_tax ? "Total TTC" : "Total HT"}
                </th>

                <th />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {formData.items.map((item, index) => {
                const product = getProduct(item.product_id);

                const quantity = Number(item.quantity || 0);

                const price = getUnitPrice(product, quantity);

                const discount = Math.min(
                  Number(item.discount_amount || 0),
                  price * quantity,
                );

                const totalHt = Math.max(price * quantity - discount, 0);

                const taxRate = formData.apply_tax ? getTaxRate(product) : 0;

                const taxAmount = (totalHt * taxRate) / 100;

                const totalTtc = totalHt + taxAmount;

                return (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        value={item.product_id}
                        onChange={(event) =>
                          updateItem(index, "product_id", event.target.value)
                        }
                        className={inputClass}
                        required
                        disabled={
                          saving || loadingOptions || !formData.location_id
                        }
                      >
                        <option value="">Select product</option>

                        {options.products.map((productOption) => (
                          <option
                            key={productOption.id}
                            value={productOption.id}
                          >
                            {productOption.name}

                            {productOption.reference
                              ? ` — ${productOption.reference}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {product
                        ? `${Number(
                            product.available_quantity ?? 0,
                          )} ${product.unit}`
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        className={inputClass}
                        disabled={saving}
                        required
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(price)} MAD
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_amount}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "discount_amount",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        disabled={saving}
                      />
                    </td>

                    <td className="px-4 py-3">
                      {formData.apply_tax ? (
                        `${taxRate.toFixed(2)}%`
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          Exempt
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {formatMoney(totalTtc)} MAD
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={saving || formData.items.length === 1}
                        aria-label="Remove product"
                        className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus size={17} />
          Add product
        </button>

        {!isEditing && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <CreditCard size={19} className="text-blue-600" />

              <h3 className="font-bold text-slate-900">Customer payment</h3>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Enter the amount received now. Any remaining balance stays linked
              to this sale.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="paid_amount"
                  className="mb-1 block text-sm font-semibold"
                >
                  Paid now
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="paid_amount"
                  type="number"
                  name="paid_amount"
                  value={formData.paid_amount}
                  onChange={handleField}
                  min="0"
                  max={totals.total}
                  step="0.01"
                  className={inputClass}
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="remaining_amount"
                  className="mb-1 block text-sm font-semibold"
                >
                  Remaining
                </label>

                <div
                  id="remaining_amount"
                  className="flex min-h-[42px] items-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-amber-800"
                >
                  {formatMoney(remainingAmount)} MAD
                </div>
              </div>
            </div>

            {paidAmountIsTooHigh && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                The paid amount cannot be greater than the sale total.
              </div>
            )}

            {hasPayment ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="payment_method_id"
                    className="mb-1 block text-sm font-semibold"
                  >
                    Payment method
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="payment_method_id"
                    name="payment_method_id"
                    value={formData.payment_method_id}
                    onChange={handleField}
                    className={inputClass}
                    disabled={saving}
                    required
                  >
                    <option value="">Select payment method</option>

                    {options.payment_methods.map((paymentMethod) => (
                      <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.name}
                      </option>
                    ))}
                  </select>
                </div>

                {requiresPaymentReference && (
                  <div>
                    <label
                      htmlFor="payment_reference"
                      className="mb-1 block text-sm font-semibold"
                    >
                      Payment reference
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      id="payment_reference"
                      type="text"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleField}
                      placeholder="Transaction or cheque reference"
                      className={inputClass}
                      disabled={saving}
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No payment will be recorded. The full sale amount will remain
                unpaid.
              </div>
            )}
          </div>
        )}

        <div className="ml-auto grid max-w-lg grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <span>Subtotal HT</span>

          <strong className="text-right">
            {formatMoney(totals.subtotal)} MAD
          </strong>

          <span>Discount</span>

          <strong className="text-right">
            −{formatMoney(totals.discount)} MAD
          </strong>

          <span>TVA</span>

          <strong className="text-right">{formatMoney(totals.tax)} MAD</strong>

          <span className="text-base font-bold">
            {formData.apply_tax ? "Total TTC" : "Total HT"}
          </span>

          <strong className="text-right text-lg text-blue-700">
            {formatMoney(totals.total)} MAD
          </strong>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-semibold">
            Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleField}
            rows={3}
            placeholder="Optional sale notes"
            className={`${inputClass} resize-y`}
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <Link
          to="/app/sales"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving || loadingOptions || paidAmountIsTooHigh}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}

          {saving
            ? isEditing
              ? "Saving..."
              : "Completing..."
            : isEditing
              ? submitText
              : "Complete sale"}
        </button>
      </div>
    </form>
  );
}

export default SaleForm;
