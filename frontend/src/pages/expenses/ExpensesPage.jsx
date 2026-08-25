import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Eye,
    FilePenLine,
    Inbox,
    Loader2,
    Plus,
    ReceiptText,
    Search,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api/axios";
import {
    ExpenseStatusBadge,
} from "../../components/expenses/ExpenseBadges";
import {
    extractApiError,
    formatDate,
    formatMoney,
} from "../../components/expenses/expenseHelpers";
import useAuth from "../../context/useAuth";
import DownloadExpenseRowPdfButton from "../../components/expenses/DownloadExpensePdfButton";

const emptyFilters = {
    search: "",
    status: "",
    payment_status: "",
    expense_category_id: "",
    location_id: "",
    month: "",
};

/*
|--------------------------------------------------------------------------
| Shared style tokens
|--------------------------------------------------------------------------
| Centralising these keeps every badge / button / input on the same
| scale instead of drifting between rows and sections over time.
*/

const styles = {
    input: "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",

    badge: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none",

    actionButton:
        "flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50",
};

function buildRequestFilters(filters) {
    const { month, ...otherFilters } = filters;

    if (!month) {
        return otherFilters;
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const lastDay = new Date(year, monthNumber, 0).getDate();

    return {
        ...otherFilters,
        date_from: `${month}-01`,
        date_to: `${month}-${String(lastDay).padStart(2, "0")}`,
    };
}

function getEmployeeName(expense) {
    const employee = expense.salary?.employee;

    if (!employee) {
        return null;
    }

    return (
        [employee.first_name, employee.last_name]
            .filter(Boolean)
            .join(" ") ||
        employee.name ||
        "Employee"
    );
}

function ExpensesPage() {
    const routeLocation = useLocation();

    const { hasPermission } = useAuth();

    const canManage = hasPermission("expenses.manage");
    const canApprove = hasPermission("expenses.approve");
    const canPay = hasPermission("expenses.pay");

    const [expenses, setExpenses] = useState([]);
    const [salaries, setSalaries] = useState([]);

    const [meta, setMeta] = useState(null);

    const [options, setOptions] = useState({
        categories: [],
        locations: [],
    });

    const [filters, setFilters] = useState(emptyFilters);

    const [request, setRequest] = useState({
        page: 1,
        filters: buildRequestFilters(emptyFilters),
        version: 0,
    });

    const [loading, setLoading] = useState(true);
    const [salariesLoading, setSalariesLoading] = useState(true);

    const [actingId, setActingId] = useState(null);

    const [error, setError] = useState("");

    const [message, setMessage] = useState(
        routeLocation.state?.message ?? "",
    );

    /*
    |--------------------------------------------------------------------------
    | Load expense options
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        api.get("/expenses/options", { signal: controller.signal })
            .then((response) => {
                const data = response.data.data ?? {};

                setOptions({
                    categories: Array.isArray(data.categories)
                        ? data.categories
                        : [],

                    locations: Array.isArray(data.locations)
                        ? data.locations
                        : [],
                });
            })
            .catch((requestError) => {
                if (requestError.code !== "ERR_CANCELED") {
                    setError(
                        extractApiError(
                            requestError,
                            "Unable to load expense filters.",
                        ),
                    );
                }
            });

        return () => controller.abort();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load normal expenses
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        api.get("/expenses", {
            params: {
                page: request.page,
                ...request.filters,
            },
            signal: controller.signal,
        })
            .then((response) => {
                const body = response.data;

                setExpenses(Array.isArray(body.data) ? body.data : []);
                setMeta(body);
                setError("");
            })
            .catch((requestError) => {
                if (requestError.code !== "ERR_CANCELED") {
                    setError(
                        extractApiError(
                            requestError,
                            "Unable to load expenses.",
                        ),
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [request]);

    /*
    |--------------------------------------------------------------------------
    | Load salaries
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        api.get("/salaries", { signal: controller.signal })
            .then((response) => {
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

                /*
                 * Only paid salaries appear inside Expenses.
                 */
                setSalaries(
                    data.filter((salary) => salary.status === "paid"),
                );
            })
            .catch((requestError) => {
                if (requestError.code !== "ERR_CANCELED") {
                    console.error(
                        "Unable to load salaries:",
                        requestError,
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSalariesLoading(false);
                }
            });

        return () => controller.abort();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Success message
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer = window.setTimeout(() => setMessage(""), 3500);

        return () => window.clearTimeout(timer);
    }, [message]);

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const applyFilters = (event) => {
        event.preventDefault();

        setLoading(true);

        setRequest((current) => ({
            page: 1,
            filters: buildRequestFilters(filters),
            version: current.version + 1,
        }));
    };

    const resetFilters = () => {
        setFilters(emptyFilters);

        setLoading(true);

        setRequest((current) => ({
            page: 1,
            filters: buildRequestFilters(emptyFilters),
            version: current.version + 1,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const changePage = (nextPage) => {
        setLoading(true);

        setRequest((current) => ({
            ...current,
            page: nextPage,
            version: current.version + 1,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Approve expense
    |--------------------------------------------------------------------------
    */

    const handleApprove = async (expense) => {
        if (
            !window.confirm(
                `Approve expense ${expense.expense_number}?`,
            )
        ) {
            return;
        }

        try {
            setActingId(expense.id);
            setError("");
            setMessage("");

            const response = await api.patch(
                `/expenses/${expense.id}/approve`,
            );

            /*
             * Immediately update the row.
             */
            setExpenses((currentExpenses) =>
                currentExpenses.map((item) =>
                    item.id === expense.id
                        ? { ...item, status: "approved" }
                        : item,
                ),
            );

            setMessage(
                response.data.message ??
                    "Expense approved successfully.",
            );

            /*
             * Reload the backend data too.
             */
            setRequest((current) => ({
                ...current,
                version: current.version + 1,
            }));
        } catch (requestError) {
            console.error(
                "Approve expense error:",
                requestError.response?.data ?? requestError,
            );

            setError(
                extractApiError(
                    requestError,
                    "Unable to approve expense.",
                ),
            );
        } finally {
            setActingId(null);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Convert paid salaries to expense-like rows
    |--------------------------------------------------------------------------
    */

    const salaryExpenses = salaries
        .filter((salary) => {
            /*
             * Month filter
             */
            if (!filters.month) {
                return true;
            }

            if (!salary.salary_month) {
                return false;
            }

            const salaryMonth = String(salary.salary_month).substring(
                0,
                7,
            );

            return salaryMonth === filters.month;
        })
        .map((salary) => {
            const employee = salary.employee;

            const employeeName = employee
                ? [employee.first_name, employee.last_name]
                      .filter(Boolean)
                      .join(" ")
                : "Unknown employee";

            return {
                id: `salary-${salary.id}`,
                type: "salary",
                title: `${employeeName}`,
                expense_number: `SAL-${salary.id}`,
                category: { name: "Salaries" },
                location: null,
                salary: { employee },
                supplier: null,
                issue_date: salary.salary_month,
                due_date: salary.salary_month,
                total_ttc: Number(salary.net_salary ?? 0),
                remaining_amount: 0,
                payment_status: "paid",
                status: "approved",
                is_overdue: false,
                salary_id: salary.id,
            };
        });

    /*
    |--------------------------------------------------------------------------
    | Search paid salaries
    |--------------------------------------------------------------------------
    */

    const filteredSalaryExpenses = salaryExpenses.filter((salary) => {
        if (!filters.search) {
            return true;
        }

        const search = filters.search.toLowerCase().trim();

        const employeeName = getEmployeeName(salary) ?? "";

        return (
            salary.title.toLowerCase().includes(search) ||
            salary.expense_number.toLowerCase().includes(search) ||
            employeeName.toLowerCase().includes(search)
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Combine expenses + paid salaries
    |--------------------------------------------------------------------------
    */

    const allExpenses = [...expenses, ...filteredSalaryExpenses];

    const isLoading = loading || salariesLoading;

    return (
        <div className="space-y-6">
            {/* =========================================================
                HEADER
            ========================================================= */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <ReceiptText size={22} />
                    </span>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Expenses and bills
                        </h1>

                        <p className="mt-0.5 text-sm text-slate-500">
                            Track operating costs, salaries,
                            approvals, due dates, and payments.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {hasPermission("expense-categories.view") && (
                        <Link
                            to="/app/expense-categories"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            Categories
                        </Link>
                    )}

                    {canManage && (
                        <Link
                            to="/app/expenses/create"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <Plus size={18} />
                            Record expense
                        </Link>
                    )}
                </div>
            </div>

            {/* =========================================================
                MESSAGES
            ========================================================= */}

            {message && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-600"
                    />
                    {message}
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            {/* =========================================================
                FILTERS
            ========================================================= */}

            <form
                onSubmit={applyFilters}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {/* Search */}

                    <div className="relative xl:col-span-2">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search number, title, employee or reference"
                            className={`${styles.input} w-full pl-10`}
                        />
                    </div>

                    {/* Approval status */}

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className={styles.input}
                    >
                        <option value="">All approval statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Payment status */}

                    <select
                        name="payment_status"
                        value={filters.payment_status}
                        onChange={handleFilterChange}
                        className={styles.input}
                    >
                        <option value="">All payment statuses</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">
                            Partially paid
                        </option>
                        <option value="paid">Paid</option>
                    </select>

                    {/* Category */}

                    <select
                        name="expense_category_id"
                        value={filters.expense_category_id}
                        onChange={handleFilterChange}
                        className={styles.input}
                    >
                        <option value="">All categories</option>

                        {options.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    {/* Location */}

                    <select
                        name="location_id"
                        value={filters.location_id}
                        onChange={handleFilterChange}
                        className={styles.input}
                    >
                        <option value="">All locations</option>

                        {options.locations.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>

                    {/* Month */}

                    <input
                        type="month"
                        name="month"
                        title="Expense month"
                        aria-label="Expense month"
                        value={filters.month}
                        onChange={handleFilterChange}
                        className={`${styles.input} xl:col-span-2`}
                    />
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
                    >
                        Apply filters
                    </button>
                </div>
            </form>

            {/* =========================================================
                TABLE
            ========================================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                {[
                                    "Expense",
                                    "Category",
                                    "Assignment",
                                    "Dates",
                                    "Total",
                                    "Balance",
                                    "Status",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        {heading}
                                    </th>
                                ))}

                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-16"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2
                                                size={22}
                                                className="animate-spin text-slate-400"
                                            />
                                            <p className="text-sm text-slate-500">
                                                Loading expenses...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : allExpenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-16"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                <Inbox size={20} />
                                            </span>
                                            <p className="text-sm font-medium text-slate-600">
                                                No expenses match these
                                                filters
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Try adjusting or
                                                resetting your filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allExpenses.map((expense) => {
                                    const isSalary =
                                        expense.type === "salary";

                                    const employeeName =
                                        getEmployeeName(expense);

                                    return (
                                        <tr
                                            key={expense.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            {/* Expense */}

                                            <td className="px-5 py-4 align-top">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-900">
                                                        {expense.title}
                                                    </p>

                                                    {isSalary && (
                                                        <span
                                                            className={`${styles.badge} bg-violet-50 text-violet-700`}
                                                        >
                                                            Salary
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-0.5 font-mono text-xs text-slate-400">
                                                    {
                                                        expense.expense_number
                                                    }
                                                </p>
                                            </td>

                                            {/* Category */}

                                            <td className="px-5 py-4 align-top text-sm text-slate-600">
                                                {isSalary
                                                    ? "Employee salary"
                                                    : (expense.category
                                                          ?.name ?? "—")}
                                            </td>

                                            {/* Assignment */}

                                            <td className="px-5 py-4 align-top text-sm text-slate-600">
                                                <p>
                                                    {isSalary
                                                        ? "Employee"
                                                        : (expense
                                                              .location
                                                              ?.name ??
                                                          "Company-wide")}
                                                </p>

                                                {employeeName ? (
                                                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                                        <UserRound
                                                            size={13}
                                                        />
                                                        {employeeName}
                                                    </p>
                                                ) : (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {expense.supplier
                                                            ?.name ??
                                                            "No supplier"}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Dates */}

                                            <td className="px-5 py-4 align-top text-sm text-slate-600">
                                                <p>
                                                    {formatDate(
                                                        expense.issue_date,
                                                    )}
                                                </p>

                                                <p className="text-xs text-slate-400">
                                                    Due:{" "}
                                                    {formatDate(
                                                        expense.due_date,
                                                    )}
                                                </p>
                                            </td>

                                            {/* Total */}

                                            <td className="px-5 py-4 align-top font-semibold tabular-nums text-slate-900">
                                                {formatMoney(
                                                    expense.total_ttc,
                                                )}{" "}
                                                <span className="text-xs font-medium text-slate-400">
                                                    MAD
                                                </span>
                                            </td>

                                            {/* Balance */}

                                            <td className="px-5 py-4 align-top">
                                                <p className="font-semibold tabular-nums text-slate-900">
                                                    {formatMoney(
                                                        expense.remaining_amount,
                                                    )}{" "}
                                                    <span className="text-xs font-medium text-slate-400">
                                                        MAD
                                                    </span>
                                                </p>
                                            </td>

                                            {/* Status */}

                                            <td className="px-5 py-4 align-top">
                                                {expense.payment_status ===
                                                "paid" ? (
                                                    <span
                                                        className={`${styles.badge} bg-emerald-100 text-emerald-700`}
                                                    >
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <ExpenseStatusBadge
                                                        status={
                                                            expense.status
                                                        }
                                                    />
                                                )}
                                            </td>

                                            {/* Actions */}

                                            <td className="px-5 py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    {/* View */}

                                                    <Link
                                                        to={
                                                            isSalary
                                                                ? `/app/salaries/${expense.salary_id}`
                                                                : `/app/expenses/${expense.id}`
                                                        }
                                                        title={
                                                            isSalary
                                                                ? "View salary"
                                                                : "View expense"
                                                        }
                                                        className={`${styles.actionButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
                                                    >
                                                        <Eye size={16} />
                                                    </Link>

                                                    {/* Download PDF */}
                                                    <DownloadExpenseRowPdfButton
                                                        expense={expense}
                                                    />

                                                    {/* Edit */}

                                                    {!isSalary &&
                                                        canManage &&
                                                        expense.status ===
                                                            "draft" && (
                                                            <Link
                                                                to={`/app/expenses/${expense.id}/edit`}
                                                                title="Edit expense"
                                                                className={`${styles.actionButton} bg-blue-50 text-blue-700 hover:bg-blue-100`}
                                                            >
                                                                <FilePenLine
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </Link>
                                                        )}

                                                    {/* Approve */}

                                                    {!isSalary &&
                                                        canApprove &&
                                                        expense.status ===
                                                            "draft" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        expense,
                                                                    )
                                                                }
                                                                disabled={
                                                                    actingId ===
                                                                    expense.id
                                                                }
                                                                title="Approve expense"
                                                                className={`${styles.actionButton} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                                                            >
                                                                {actingId ===
                                                                expense.id ? (
                                                                    <Loader2
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                )}
                                                            </button>
                                                        )}

                                                    {/* Payment */}

                                                    {!isSalary &&
                                                        canPay &&
                                                        expense.status ===
                                                            "approved" &&
                                                        expense.payment_status !==
                                                            "paid" && (
                                                            <Link
                                                                to={`/app/expenses/${expense.id}/payments`}
                                                                title="Record payment"
                                                                className={`${styles.actionButton} bg-violet-50 text-violet-700 hover:bg-violet-100`}
                                                            >
                                                                <CreditCard
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </Link>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* =====================================================
                    PAGINATION
                ===================================================== */}

                {meta && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 text-sm">
                        <span className="text-slate-500">
                            {(meta.total ?? expenses.length) +
                                filteredSalaryExpenses.length}{" "}
                            expenses
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!meta.prev_page_url}
                                onClick={() =>
                                    changePage(
                                        Math.max(request.page - 1, 1),
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="px-2 text-slate-600">
                                Page{" "}
                                <span className="font-semibold text-slate-900">
                                    {meta.current_page ?? 1}
                                </span>{" "}
                                of {meta.last_page ?? 1}
                            </span>

                            <button
                                type="button"
                                disabled={!meta.next_page_url}
                                onClick={() =>
                                    changePage(request.page + 1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpensesPage;
