import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useLocation,
    useParams,
} from "react-router-dom";
import {
    ArrowLeft,
    Banknote,
    Building2,
    CreditCard,
    Handshake,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ReceiptText,
    UserRound,
    WalletCards,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const formatMoney = (amount) =>
    new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 2,
    }).format(Number(amount ?? 0));

const formatDate = (date) => {
    if (!date) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "fr-MA",
        {
            dateStyle: "medium",
        }
    ).format(new Date(date));
};

const statusClasses = {
    confirmed:
        "bg-green-100 text-green-700",
    draft:
        "bg-amber-100 text-amber-700",
    cancelled:
        "bg-red-100 text-red-700",
    paid:
        "bg-green-100 text-green-700",
    partially_paid:
        "bg-amber-100 text-amber-700",
    unpaid:
        "bg-red-100 text-red-700",
};

function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
    color = "blue",
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-700",
        violet:
            "bg-violet-50 text-violet-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-slate-400">
                            {description}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function FournisseurDetails() {
    const { id } = useParams();
    const location = useLocation();
    const { hasPermission } = useAuth();

    const canManage = hasPermission(
        "fournisseurs.manage"
    );

    const [fournisseur, setFournisseur] =
        useState(null);

    const [summary, setSummary] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState(
            location.state?.message ?? ""
        );

    useEffect(() => {
        let cancelled = false;

        const loadFournisseur =
            async () => {
                try {
                    const response =
                        await api.get(
                            `/fournisseurs/${id}`
                        );

                    if (!cancelled) {
                        setFournisseur(
                            response.data.data
                                .fournisseur
                        );

                        setSummary(
                            response.data.data
                                .summary
                        );
                    }
                } catch (
                    requestError
                ) {
                    console.error(
                        requestError
                    );

                    if (!cancelled) {
                        setError(
                            requestError
                                .response?.data
                                ?.message ??
                                "Unable to load fournisseur."
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };

        loadFournisseur();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer =
            window.setTimeout(
                () => {
                    setMessage("");
                },
                3000
            );

        return () => {
            window.clearTimeout(timer);
        };
    }, [message]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading fournisseur...
            </div>
        );
    }

    if (error || !fournisseur) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error ||
                        "Fournisseur not found."}
                </div>

                <Link
                    to="/app/fournisseurs"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                >
                    <ArrowLeft size={17} />
                    Back to fournisseurs
                </Link>
            </div>
        );
    }

    const sales = Array.isArray(
        fournisseur.sales
    )
        ? fournisseur.sales
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        to="/app/fournisseurs"
                        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft size={17} />
                        Back to fournisseurs
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <Handshake
                                size={27}
                            />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-950">
                                    {
                                        fournisseur.name
                                    }
                                </h1>

                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        fournisseur.status ===
                                        "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {
                                        fournisseur.status
                                    }
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                {
                                    fournisseur.code
                                }{" "}
                                ·{" "}
                                {
                                    fournisseur.entity_type
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to={`/app/fournisseurs/${fournisseur.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <Pencil size={17} />
                        Edit fournisseur
                    </Link>
                )}
            </div>

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total sales"
                    value={formatMoney(
                        summary?.total_sales
                    )}
                    description={`${
                        summary?.orders_count ?? 0
                    } confirmed orders`}
                    icon={ReceiptText}
                    color="blue"
                />

                <SummaryCard
                    title="Total paid"
                    value={formatMoney(
                        summary?.total_paid
                    )}
                    description="Payments received"
                    icon={Banknote}
                    color="green"
                />

                <SummaryCard
                    title="Remaining debt"
                    value={formatMoney(
                        summary?.remaining_amount
                    )}
                    description="Amount still unpaid"
                    icon={WalletCards}
                    color={
                        Number(
                            summary?.remaining_amount
                        ) > 0
                            ? "red"
                            : "green"
                    }
                />

                <SummaryCard
                    title="Available credit"
                    value={formatMoney(
                        summary?.available_credit
                    )}
                    description={`Limit: ${formatMoney(
                        summary?.credit_limit
                    )}`}
                    icon={CreditCard}
                    color="violet"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-900">
                        Fournisseur information
                    </h2>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="flex gap-3">
                            <UserRound className="mt-0.5 h-5 w-5 text-slate-400" />

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Account user
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {fournisseur
                                        .user
                                        ?.name ||
                                        "-"}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {fournisseur
                                        .user
                                        ?.email ||
                                        ""}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Phone className="mt-0.5 h-5 w-5 text-slate-400" />

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Phone
                                </p>

                                <p className="mt-1 text-sm text-slate-800">
                                    {fournisseur.phone ||
                                        "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Mail className="mt-0.5 h-5 w-5 text-slate-400" />

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Email
                                </p>

                                <p className="mt-1 text-sm text-slate-800">
                                    {fournisseur.email ||
                                        "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Building2 className="mt-0.5 h-5 w-5 text-slate-400" />

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    ICE
                                </p>

                                <p className="mt-1 text-sm text-slate-800">
                                    {fournisseur.ice ||
                                        "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 sm:col-span-2">
                            <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Address
                                </p>

                                <p className="mt-1 text-sm text-slate-800">
                                    {[
                                        fournisseur.address,
                                        fournisseur.city,
                                    ]
                                        .filter(Boolean)
                                        .join(", ") ||
                                        "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">
                        Payment conditions
                    </h2>

                    <dl className="mt-6 space-y-5">
                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                Credit limit
                            </dt>

                            <dd className="mt-1 text-lg font-bold text-slate-900">
                                {formatMoney(
                                    summary?.credit_limit
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                Payment terms
                            </dt>

                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                                {fournisseur.payment_terms_days ??
                                    0}{" "}
                                days
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                Notes
                            </dt>

                            <dd className="mt-1 whitespace-pre-line text-sm text-slate-600">
                                {fournisseur.notes ||
                                    "No notes."}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">
                        Recent sales
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Latest orders made by this
                        fournisseur.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Sale
                                </th>

                                <th className="px-5 py-4">
                                    Date
                                </th>

                                <th className="px-5 py-4">
                                    Location
                                </th>

                                <th className="px-5 py-4">
                                    Total
                                </th>

                                <th className="px-5 py-4">
                                    Paid
                                </th>

                                <th className="px-5 py-4">
                                    Remaining
                                </th>

                                <th className="px-5 py-4">
                                    Payment
                                </th>

                                <th className="px-5 py-4 text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {sales.length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        No sales
                                        found.
                                    </td>
                                </tr>
                            ) : (
                                sales.map(
                                    (sale) => {
                                        const remaining =
                                            Math.max(
                                                Number(
                                                    sale.total_ttc ??
                                                        0
                                                ) -
                                                    Number(
                                                        sale.paid_amount ??
                                                            0
                                                    ),
                                                0
                                            );

                                        return (
                                            <tr
                                                key={
                                                    sale.id
                                                }
                                                className="hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {sale.sale_number ||
                                                            `Sale #${sale.id}`}
                                                    </p>

                                                    <span
                                                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                            statusClasses[
                                                                sale
                                                                    .status
                                                            ] ??
                                                            "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {
                                                            sale.status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDate(
                                                        sale.sale_date
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {sale
                                                        .location
                                                        ?.name ||
                                                        "-"}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                    {formatMoney(
                                                        sale.total_ttc
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-green-700">
                                                    {formatMoney(
                                                        sale.paid_amount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-red-600">
                                                    {formatMoney(
                                                        remaining
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            statusClasses[
                                                                sale
                                                                    .payment_status
                                                            ] ??
                                                            "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {sale.payment_status ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        to={`/app/sales/${sale.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                    >
                                                        <ReceiptText
                                                            size={
                                                                15
                                                            }
                                                        />
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default FournisseurDetails;
