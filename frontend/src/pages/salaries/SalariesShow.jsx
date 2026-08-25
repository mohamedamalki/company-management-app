import { ArrowLeft, FilePenLine, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const statusClass = (status) => {
    switch (status) {
        case "paid":
            return "bg-emerald-50 text-emerald-700";
        case "cancelled":
            return "bg-red-50 text-red-700";
        default:
            return "bg-amber-50 text-amber-700";
    }
};

const formatMoney = (amount) =>
    `${Number(amount ?? 0).toLocaleString()} MAD`;

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString("en-GB");
};

function SalariesShow() {
    const { id } = useParams();
    const { hasPermission } = useAuth();

    const canManage = hasPermission("salaries.manage");

    const [salary, setSalary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
     * Reset state synchronously during render when `id` changes,
     * instead of calling setState at the top of the effect below.
     * See: https://react.dev/learn/you-might-not-need-an-effect
     */
    const [loadedId, setLoadedId] = useState(id);

    if (id !== loadedId) {
        setLoadedId(id);
        setLoading(true);
        setSalary(null);
        setError("");
    }

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        api.get(`/salaries/${id}`, { signal: controller.signal })
            .then((response) => {
                const body = response.data;

                const data = body.data ?? body.salary ?? body;

                if (!cancelled) {
                    setSalary(data);
                }
            })
            .catch((requestError) => {
                if (requestError.code !== "ERR_CANCELED" && !cancelled) {
                    setError(
                        requestError.response?.data?.message ??
                            "Unable to load this salary.",
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
            controller.abort();
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-400">
                Loading salary...
            </div>
        );
    }

    if (error || !salary) {
        return (
            <div className="space-y-4">
                <Link
                    to="/app/salaries"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft size={16} />
                    Back to salaries
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || "Salary not found."}
                </div>
            </div>
        );
    }

    const employee = salary.employee;

    const employeeName = employee
        ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()
        : "Unknown employee";

    const fields = [
        { label: "Base salary", value: formatMoney(salary.base_salary) },
        { label: "Bonuses", value: `+${formatMoney(salary.bonuses)}` },
        { label: "Deductions", value: `-${formatMoney(salary.deductions)}` },
        { label: "Net salary", value: formatMoney(salary.net_salary) },
        { label: "Salary month", value: formatDate(salary.salary_month) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/app/salaries"
                        title="Back to salaries"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                    >
                        <ArrowLeft size={18} />
                    </Link>

                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <ReceiptText size={22} />
                    </span>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            {employeeName}
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            {employee?.position ?? "—"} · SAL-{salary.id}
                        </p>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to={`/app/salaries/${salary.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <FilePenLine size={16} />
                        Edit salary
                    </Link>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Salary details
                    </h2>

                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(
                            salary.status,
                        )}`}
                    >
                        {salary.status}
                    </span>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {fields.map((field) => (
                        <div key={field.label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {field.label}
                            </dt>
                            <dd className="mt-1 text-base font-semibold text-slate-900">
                                {field.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

export default SalariesShow;
