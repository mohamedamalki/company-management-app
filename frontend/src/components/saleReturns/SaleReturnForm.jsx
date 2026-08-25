import {
  Loader2,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function apiError(error, fallback) {
  const errors =
    error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ??
        fallback);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatQuantity(value) {
  return numberValue(value).toLocaleString(
    "fr-MA",
    {
      maximumFractionDigits: 3,
    },
  );
}

function formatMoney(value) {
  return numberValue(value).toLocaleString(
    "fr-MA",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function initialItems(initialData) {
  if (!Array.isArray(initialData?.items)) {
    return [];
  }

  return initialData.items.map((item) => ({
    sale_item_id: String(
      item.sale_item_id ?? "",
    ),
    quantity: String(
      item.quantity ?? "",
    ),
    restock_quantity: String(
      item.restock_quantity ?? "",
    ),
    damaged_quantity: String(
      item.damaged_quantity ?? "",
    ),
    notes: item.notes ?? "",
  }));
}

function SaleReturnForm({
  initialData = null,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save return",
}) {
  const editing = Boolean(initialData?.id);

  const [formData, setFormData] =
    useState(() => ({
      sale_id: String(
        initialData?.sale_id ?? "",
      ),
      reason:
        initialData?.reason ?? "",
      notes:
        initialData?.notes ?? "",
      items: initialItems(initialData),
    }));

  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] =
    useState(
      initialData?.sale ?? null,
    );
  const [returnableItems, setReturnableItems] =
    useState([]);
  const [loadingOptions, setLoadingOptions] =
    useState(true);
  const [optionsError, setOptionsError] =
    useState("");

  const selectedSaleId =
    formData.sale_id;

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        setOptionsError("");

        const response = await api.get(
          "/sale-returns/options",
          {
            params: {
              sale_id:
                selectedSaleId ||
                undefined,
            },
          },
        );

        if (cancelled) {
          return;
        }

        const data =
          response.data.data ?? {};

        setSales(
          Array.isArray(data.sales)
            ? data.sales
            : [],
        );

        setSelectedSale(
          data.selected_sale ?? null,
        );

        setReturnableItems(
          Array.isArray(
            data.returnable_items,
          )
            ? data.returnable_items
            : [],
        );
      } catch (requestError) {
        if (!cancelled) {
          setOptionsError(
            apiError(
              requestError,
              "Unable to load return options.",
            ),
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
  }, [selectedSaleId]);

  const itemsById = useMemo(
    () =>
      new Map(
        formData.items.map((item) => [
          String(item.sale_item_id),
          item,
        ]),
      ),
    [formData.items],
  );

  const estimatedTotal = useMemo(
    () =>
      returnableItems.reduce(
        (total, item) => {
          const formItem =
            itemsById.get(
              String(
                item.sale_item_id ??
                  item.id,
              ),
            );

          const quantity =
            numberValue(
              formItem?.quantity,
            );

          const soldQuantity =
            numberValue(
              item.sold_quantity,
            );

          if (
            quantity <= 0 ||
            soldQuantity <= 0
          ) {
            return total;
          }

          return (
            total +
            (numberValue(
              item.total_ttc,
            ) /
              soldQuantity) *
              quantity
          );
        },
        0,
      ),
    [itemsById, returnableItems],
  );

  const updateLine = (
    saleItemId,
    changes,
  ) => {
    const key =
      String(saleItemId);

    setFormData((current) => {
      const existing =
        current.items.find(
          (item) =>
            String(
              item.sale_item_id,
            ) === key,
        );

      const nextItem = {
        sale_item_id: key,
        quantity: "",
        restock_quantity: "",
        damaged_quantity: "0",
        notes: "",
        ...existing,
        ...changes,
      };

      const remaining =
        current.items.filter(
          (item) =>
            String(
              item.sale_item_id,
            ) !== key,
        );

      return {
        ...current,
        items: [
          ...remaining,
          nextItem,
        ],
      };
    });
  };

  const handleSaleChange = (
    event,
  ) => {
    setFormData((current) => ({
      ...current,
      sale_id:
        event.target.value,
      items: [],
    }));
  };

  const handleQuantityChange = (
    saleItemId,
    value,
  ) => {
    updateLine(saleItemId, {
      quantity: value,
      restock_quantity: value,
      damaged_quantity: "0",
    });
  };

  const handleRestockChange = (
    saleItemId,
    value,
  ) => {
    const current =
      itemsById.get(
        String(saleItemId),
      );

    const quantity =
      numberValue(
        current?.quantity,
      );

    const restock = Math.min(
      Math.max(
        numberValue(value),
        0,
      ),
      quantity,
    );

    updateLine(saleItemId, {
      restock_quantity:
        value === ""
          ? ""
          : String(restock),
      damaged_quantity:
        String(
          Math.max(
            quantity - restock,
            0,
          ),
        ),
    });
  };

  const handleDamagedChange = (
    saleItemId,
    value,
  ) => {
    const current =
      itemsById.get(
        String(saleItemId),
      );

    const quantity =
      numberValue(
        current?.quantity,
      );

    const damaged = Math.min(
      Math.max(
        numberValue(value),
        0,
      ),
      quantity,
    );

    updateLine(saleItemId, {
      damaged_quantity:
        value === ""
          ? ""
          : String(damaged),
      restock_quantity:
        String(
          Math.max(
            quantity - damaged,
            0,
          ),
        ),
    });
  };

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    const items =
      formData.items
        .filter(
          (item) =>
            numberValue(
              item.quantity,
            ) > 0,
        )
        .map((item) => ({
          sale_item_id: Number(
            item.sale_item_id,
          ),
          quantity: numberValue(
            item.quantity,
          ),
          restock_quantity:
            numberValue(
              item.restock_quantity,
            ),
          damaged_quantity:
            numberValue(
              item.damaged_quantity,
            ),
          notes:
            item.notes.trim() ||
            null,
        }));

    if (!formData.sale_id) {
      setOptionsError(
        "Select a confirmed sale.",
      );
      return;
    }

    if (items.length === 0) {
      setOptionsError(
        "Enter a returned quantity for at least one product.",
      );
      return;
    }

    const invalidClassification =
      items.some(
        (item) =>
          Math.abs(
            item.quantity -
              (item.restock_quantity +
                item.damaged_quantity),
          ) > 0.0005,
      );

    if (invalidClassification) {
      setOptionsError(
        "For every product, sellable plus damaged quantity must equal the returned quantity.",
      );
      return;
    }

    setOptionsError("");

    onSubmit({
      ...(editing
        ? {}
        : {
            sale_id: Number(
              formData.sale_id,
            ),
          }),
      reason:
        formData.reason.trim(),
      notes:
        formData.notes.trim() ||
        null,
      items,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <RotateCcw size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {editing
              ? "Update sale return"
              : "New sale return"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Only sellable quantities are
            returned to available stock.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {(error ||
          optionsError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || optionsError}
          </div>
        )}

        {/* Sale selection */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Confirmed sale{" "}
            <span className="text-red-500">
              *
            </span>
          </label>

          <select
            value={formData.sale_id}
            onChange={
              handleSaleChange
            }
            disabled={
              editing ||
              saving ||
              loadingOptions
            }
            className={inputClass}
            required
          >
            <option value="">
              {loadingOptions
                ? "Loading sales..."
                : "Select a sale"}
            </option>

            {sales.map((sale) => (
              <option
                key={sale.id}
                value={sale.id}
              >
                {sale.sale_number} —{" "}
                {sale.customer?.name ??
                  "Walk-in customer"}
              </option>
            ))}
          </select>
        </div>

        {/* Selected sale */}
        {selectedSale && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center gap-2">
              <PackageCheck
                size={18}
                className="text-slate-600"
              />

              <h3 className="font-bold text-slate-900">
                Original sale
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Sale
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {
                    selectedSale.sale_number
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedSale
                    .customer
                    ?.name ??
                    "Walk-in customer"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Location
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedSale
                    .location
                    ?.name ?? "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {selectedSaleId && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <PackageCheck
                size={18}
                className="text-slate-600"
              />

              <div>
                <h3 className="font-bold text-slate-900">
                  Returned products
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Select quantities and classify
                  each returned product.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      Returnable
                    </th>

                    <th className="px-5 py-4">
                      Returned
                    </th>

                    <th className="px-5 py-4">
                      Sellable
                    </th>

                    <th className="px-5 py-4">
                      Damaged
                    </th>

                    <th className="px-5 py-4">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingOptions ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center"
                      >
                        <Loader2
                          className="mx-auto animate-spin text-blue-600"
                          size={22}
                        />
                      </td>
                    </tr>
                  ) : returnableItems.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        This sale has no
                        quantities available
                        to return.
                      </td>
                    </tr>
                  ) : (
                    returnableItems.map(
                      (item) => {
                        const itemId =
                          String(
                            item.sale_item_id ??
                              item.id,
                          );

                        const current =
                          itemsById.get(
                            itemId,
                          ) ?? {};

                        return (
                          <tr
                            key={itemId}
                            className="hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {
                                  item.product_name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {item.product_reference ??
                                  "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatQuantity(
                                item.returnable_quantity,
                              )}{" "}
                              {item.unit}
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="number"
                                min="0"
                                max={
                                  item.returnable_quantity
                                }
                                step="0.001"
                                value={
                                  current.quantity ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleQuantityChange(
                                    itemId,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                                disabled={
                                  saving
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="number"
                                min="0"
                                max={
                                  current.quantity ||
                                  0
                                }
                                step="0.001"
                                value={
                                  current.restock_quantity ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleRestockChange(
                                    itemId,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                className="w-28 rounded-xl border border-green-300 bg-green-50 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                                disabled={
                                  saving ||
                                  !numberValue(
                                    current.quantity,
                                  )
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="number"
                                min="0"
                                max={
                                  current.quantity ||
                                  0
                                }
                                step="0.001"
                                value={
                                  current.damaged_quantity ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleDamagedChange(
                                    itemId,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                className="w-28 rounded-xl border border-red-300 bg-red-50 px-3 py-2 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                disabled={
                                  saving ||
                                  !numberValue(
                                    current.quantity,
                                  )
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="text"
                                value={
                                  current.notes ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateLine(
                                    itemId,
                                    {
                                      notes:
                                        event
                                          .target
                                          .value,
                                    },
                                  )
                                }
                                className="w-full min-w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                                placeholder="Optional"
                                disabled={
                                  saving
                                }
                              />
                            </td>
                          </tr>
                        );
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reason + notes */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Return reason{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <textarea
              value={formData.reason}
              onChange={(event) =>
                setFormData(
                  (current) => ({
                    ...current,
                    reason:
                      event.target
                        .value,
                  }),
                )
              }
              rows="4"
              maxLength="1000"
              className={`${inputClass} resize-none`}
              placeholder="Example: Damaged product or incorrect item"
              disabled={saving}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Internal notes
            </label>

            <textarea
              value={formData.notes}
              onChange={(event) =>
                setFormData(
                  (current) => ({
                    ...current,
                    notes:
                      event.target
                        .value,
                  }),
                )
              }
              rows="4"
              maxLength="2000"
              className={`${inputClass} resize-none`}
              placeholder="Optional notes"
              disabled={saving}
            />
          </div>
        </div>

        {/* Estimated total */}
        <div className="ml-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600">
              Estimated return total
            </span>

            <strong className="text-base font-bold text-slate-900">
              {formatMoney(
                estimatedTotal,
              )}{" "}
              MAD
            </strong>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            The backend calculates the
            authoritative value from the
            original sale lines.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to="/app/sale-returns"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            saving || loadingOptions
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && (
            <Loader2
              size={17}
              className="animate-spin"
            />
          )}

          {saving
            ? "Saving..."
            : submitText}
        </button>
      </div>
    </form>
  );
}

export default SaleReturnForm;
