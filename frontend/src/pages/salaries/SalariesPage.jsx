import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function SalariesPage() {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadSalaries = async () => {
            try {
                const response =
                    await api.get("/salaries");

                const body = response.data;

                const data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.salaries)
                        ? body.salaries
                        : Array.isArray(body)
                          ? body
                          : [];

                if (!cancelled) {
                    setSalaries(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                            "Unable to load salaries."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSalaries();

        return () => {
            cancelled = true;
        };
    }, []);

    const formatMoney = (amount) => {
        return `${Number(amount ?? 0).toLocaleString()} MAD`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-GB"
        );
    };

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

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Salaries
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage employee salaries and
                            payments.
                        </p>
                    </div>

                    <Link
                        to="/app/salaries/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        <span className="text-lg">
                            +
                        </span>

                        Create salary
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Employee
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Month
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Base salary
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Bonuses
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Deductions
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Net salary
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({
                                        length: 5,
                                    }).map((_, index) => (
                                        <tr key={index}>
                                            <td
                                                colSpan={8}
                                                className="px-5 py-4"
                                            >
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : salaries.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                No salaries
                                                yet
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Create the
                                                first salary
                                                record.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    salaries.map(
                                        (salary) => {
                                            const employee =
                                                salary.employee;

                                            return (
                                                <tr
                                                    key={
                                                        salary.id
                                                    }
                                                    className="hover:bg-slate-50"
                                                >
                                                    {/* Employee */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 font-semibold text-violet-700">
                                                                {employee?.first_name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <p className="font-medium text-slate-800">
                                                                    {employee
                                                                        ? `${employee.first_name} ${employee.last_name}`
                                                                        : "Unknown employee"}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {employee?.position ??
                                                                        "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Month */}
                                                    <td className="px-5 py-3.5 text-slate-600">
                                                        {formatDate(
                                                            salary.salary_month
                                                        )}
                                                    </td>

                                                    {/* Base */}
                                                    <td className="px-5 py-3.5 text-slate-600">
                                                        {formatMoney(
                                                            salary.base_salary
                                                        )}
                                                    </td>

                                                    {/* Bonuses */}
                                                    <td className="px-5 py-3.5 text-emerald-600">
                                                        +
                                                        {formatMoney(
                                                            salary.bonuses
                                                        )}
                                                    </td>

                                                    {/* Deductions */}
                                                    <td className="px-5 py-3.5 text-red-600">
                                                        -
                                                        {formatMoney(
                                                            salary.deductions
                                                        )}
                                                    </td>

                                                    {/* Net */}
                                                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                                                        {formatMoney(
                                                            salary.net_salary
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-3.5">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(
                                                                salary.status
                                                            )}`}
                                                        >
                                                            {
                                                                salary.status
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Link
                                                            to={`/app/salaries/${salary.id}/edit`}
                                                            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                        >
                                                            Edit
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
        </div>
    );
}

export default SalariesPage;
