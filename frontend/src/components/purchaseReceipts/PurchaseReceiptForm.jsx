import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    Loader2,
    PackageCheck,
} from "lucide-react";
import api from "../../api/axios";

const emptyForm = {
    purchase_order_id: "",
    received_at: "",
    notes: "",
    items: [],
};

function formatDateForInput(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    const localDate = new Date(
        date.getTime() -
            date.getTimezoneOffset() * 60000
    );

    return localDate
        .toISOString()
        .slice(0, 16);
}

function createInitialForm(initialData) {
    if (!initialData?.id) {
        return emptyForm;
    }

    return {
        purchase_order_id: String(
            initialData.purchase_order_id ??
                initialData.purchase_order?.id ??
                ""
        ),

        received_at: formatDateForInput(
            initialData.received_at
        ),

        notes: initialData.notes ?? "",

        items: Array.isArray(initialData.items)
            ? initialData.items.map((item) => ({
                  purchase_order_item_id: String(
                      item.purchase_order_item_id
                  ),

                  received_quantity: String(
                      item.received_quantity ?? ""
                  ),

                  accepted_quantity: String(
                      item.accepted_quantity ?? ""
                  ),

                  rejected_quantity: String(
                      item.rejected_quantity ?? "0"
                  ),

                  notes: item.notes ?? "",

                  product: item.product ?? null,
              }))
            : [],
    };
}

function PurchaseReceiptForm({
    initialData = null,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save receipt",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(
        () => createInitialForm(initialData)
    );

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] =
        useState(true);

    const [optionsError, setOptionsError] =
        useState("");

    const [localError, setLocalError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadOrders = async () => {
            try {
                const response = await api.get(
                    "/purchase-receipts/receivable-orders"
                );

                if (!cancelled) {
                    setOrders(
                        Array.isArray(response.data.data)
                            ? response.data.data
                            : []
                    );
                }
            } catch (requestError) {
                console.error(requestError);

                if (!cancelled) {
                    setOptionsError(
                        requestError.response?.data
                            ?.message ??
                            "Unable to load purchase orders."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingOrders(false);
                }
            }
        };

        loadOrders();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedOrder = useMemo(
        () =>
            orders.find(
                (order) =>
                    String(order.id) ===
                    String(
                        formData.purchase_order_id
                    )
            ) ?? null,
        [orders, formData.purchase_order_id]
    );

    const handleOrderChange = (event) => {
        const orderId = event.target.value;

        const order = orders.find(
            (item) =>
                String(item.id) ===
                String(orderId)
        );

        setLocalError("");

        setFormData({
            ...formData,
            purchase_order_id: orderId,

            items: order
                ? order.items.map((item) => ({
                      purchase_order_item_id:
                          String(item.id),

                      received_quantity: "",
                      accepted_quantity: "",
                      rejected_quantity: "0",
                      notes: "",
                      product:
                          item.product ?? null,

                      remaining_quantity:
                          item.remaining_quantity,
                  }))
                : [],
        });
    };

    const handleGeneralChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        setFormData((current) => {
            const items = [...current.items];
            const currentItem = {
                ...items[index],
            };

            if (
                field === "received_quantity" ||
                field === "rejected_quantity"
            ) {
                let received =
                    field === "received_quantity"
                        ? Number(value || 0)
                        : Number(
                              currentItem
                                  .received_quantity ||
                                  0
                          );

                let rejected =
                    field === "rejected_quantity"
                        ? Number(value || 0)
                        : Number(
                              currentItem
                                  .rejected_quantity ||
                                  0
                          );

                if (rejected > received) {
                    rejected = received;
                }

                const accepted = Math.max(
                    received - rejected,
                    0
                );

                currentItem.received_quantity =
                    field === "received_quantity"
                        ? value
                        : currentItem.received_quantity;

                currentItem.rejected_quantity =
                    field === "rejected_quantity"
                        ? String(rejected)
                        : currentItem.rejected_quantity;

                currentItem.accepted_quantity =
                    received > 0
                        ? String(accepted)
                        : "";
            } else {
                currentItem[field] = value;
            }

            items[index] = currentItem;

            return {
                ...current,
                items,
            };
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLocalError("");

        const selectedItems =
            formData.items.filter(
                (item) =>
                    Number(
                        item.received_quantity
                    ) > 0
            );

        if (!formData.purchase_order_id) {
            setLocalError(
                "Select a purchase order."
            );

            return;
        }

        if (selectedItems.length === 0) {
            setLocalError(
                "Enter a received quantity for at least one product."
            );

            return;
        }

        onSubmit({
            purchase_order_id: Number(
                formData.purchase_order_id
            ),

            received_at:
                formData.received_at || null,

            notes:
                formData.notes.trim() || null,

            items: selectedItems.map(
                (item) => ({
                    purchase_order_item_id:
                        Number(
                            item.purchase_order_item_id
                        ),

                    received_quantity:
                        Number(
                            item.received_quantity
                        ),

                    accepted_quantity:
                        Number(
                            item.accepted_quantity
                        ),

                    rejected_quantity:
                        Number(
                            item.rejected_quantity
                        ),

                    notes:
                        item.notes.trim() ||
                        null,
                })
            ),
        });
    };

    const getItemProduct = (item) => {
        if (item.product) {
            return item.product;
        }

        const orderItem =
            selectedOrder?.items?.find(
                (selectedItem) =>
                    String(selectedItem.id) ===
                    String(
                        item.purchase_order_item_id
                    )
            );

        return orderItem?.product ?? null;
    };

    const getRemainingQuantity = (item) => {
        if (
            item.remaining_quantity !==
            undefined
        ) {
            return item.remaining_quantity;
        }

        const orderItem =
            selectedOrder?.items?.find(
                (selectedItem) =>
                    String(selectedItem.id) ===
                    String(
                        item.purchase_order_item_id
                    )
            );

        return (
            orderItem?.remaining_quantity ??
            "-"
        );
    };

    const inputClass =
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-semibold text-slate-700";

    const displayedError =
        localError || error || optionsError;

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <PackageCheck size={21} />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {isEditing
                            ? "Update purchase receipt"
                            : "New purchase receipt"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Record accepted and rejected
                        products received from a
                        supplier.
                    </p>
                </div>
            </div>

            <div className="space-y-8 p-6">
                {displayedError && (
                    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle
                            size={19}
                            className="shrink-0"
                        />

                        <span>
                            {displayedError}
                        </span>
                    </div>
                )}

                <section>
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Receipt information
                    </p>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="purchase_order_id"
                                className={
                                    labelClass
                                }
                            >
                                Purchase order
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <select
                                id="purchase_order_id"
                                name="purchase_order_id"
                                value={
                                    formData.purchase_order_id
                                }
                                onChange={
                                    handleOrderChange
                                }
                                disabled={
                                    saving ||
                                    loadingOrders
                                }
                                className={
                                    inputClass
                                }
                                required
                            >
                                <option value="">
                                    {loadingOrders
                                        ? "Loading purchase orders..."
                                        : "Select a purchase order"}
                                </option>

                                {orders.map(
                                    (order) => (
                                        <option
                                            key={
                                                order.id
                                            }
                                            value={
                                                order.id
                                            }
                                        >
                                            {order.order_number ??
                                                `Order #${order.id}`}
                                            {" — "}
                                            {order
                                                .supplier
                                                ?.name ??
                                                "Supplier"}
                                            {" — "}
                                            {order
                                                .location
                                                ?.name ??
                                                "Location"}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="received_at"
                                className={
                                    labelClass
                                }
                            >
                                Reception date
                            </label>

                            <input
                                id="received_at"
                                type="datetime-local"
                                name="received_at"
                                value={
                                    formData.received_at
                                }
                                onChange={
                                    handleGeneralChange
                                }
                                disabled={saving}
                                className={
                                    inputClass
                                }
                            />
                        </div>
                    </div>

                    {selectedOrder && (
                        <div className="mt-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-semibold uppercase text-blue-500">
                                    Supplier
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {selectedOrder
                                        .supplier
                                        ?.name ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-blue-500">
                                    Location
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {selectedOrder
                                        .location
                                        ?.name ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-blue-500">
                                    Receiving status
                                </p>

                                <p className="mt-1 font-semibold capitalize text-slate-900">
                                    {selectedOrder.receiving_status?.replaceAll(
                                        "_",
                                        " "
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                <section>
                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Received products
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Products with an empty
                            received quantity will not
                            be submitted.
                        </p>
                    </div>

                    {formData.items.length ===
                    0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                            Select a purchase order to
                            display its products.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[950px] text-left">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Product
                                        </th>

                                        <th className="px-4 py-3">
                                            Remaining
                                        </th>

                                        <th className="px-4 py-3">
                                            Received
                                        </th>

                                        <th className="px-4 py-3">
                                            Rejected
                                        </th>

                                        <th className="px-4 py-3">
                                            Accepted
                                        </th>

                                        <th className="px-4 py-3">
                                            Notes
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map(
                                        (
                                            item,
                                            index
                                        ) => {
                                            const product =
                                                getItemProduct(
                                                    item
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        item.purchase_order_item_id
                                                    }
                                                >
                                                    <td className="px-4 py-4">
                                                        <p className="font-semibold text-slate-900">
                                                            {product?.name ??
                                                                "Product"}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {product?.reference ??
                                                                "-"}
                                                            {product?.unit
                                                                ? ` · ${product.unit}`
                                                                : ""}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                                        {getRemainingQuantity(
                                                            item
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={
                                                                item.received_quantity
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "received_quantity",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                            placeholder="0"
                                                            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={
                                                                item.rejected_quantity
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "rejected_quantity",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={
                                                                item.accepted_quantity
                                                            }
                                                            readOnly
                                                            className="w-28 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.notes
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "notes",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                            placeholder="Optional"
                                                            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section>
                    <label
                        htmlFor="notes"
                        className={labelClass}
                    >
                        General notes
                    </label>

                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={
                            handleGeneralChange
                        }
                        disabled={saving}
                        rows={4}
                        maxLength={2000}
                        placeholder="Delivery note, supplier reference, observations..."
                        className={`${inputClass} resize-y`}
                    />
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/app/purchase-receipts"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving || loadingOrders
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

export default PurchaseReceiptForm;
