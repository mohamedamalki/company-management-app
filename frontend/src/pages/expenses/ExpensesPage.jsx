import {
  CheckCircle2,
  CreditCard,
  Eye,
  FilePenLine,
  Plus,
  ReceiptText,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import api from "../../api/axios";
import {
  ExpenseStatusBadge,
  PaymentStatusBadge,
} from "../../components/expenses/ExpenseBadges";
import {
  extractApiError,
  formatDate,
  formatMoney,
} from "../../components/expenses/expenseHelpers";
import useAuth from "../../context/useAuth";

const emptyFilters = {
  search: "",
  status: "",
  payment_status: "",
  expense_category_id: "",
  location_id: "",
  month: "",
};

function buildRequestFilters(filters) {
  const {
    month,
    ...otherFilters
  } = filters;

  if (!month) {
    return otherFilters;
  }

  const [
    year,
    monthNumber,
  ] = month
    .split("-")
    .map(Number);

  const lastDay = new Date(
    year,
    monthNumber,
    0,
  ).getDate();

  return {
    ...otherFilters,
    date_from: `${month}-01`,
    date_to: `${month}-${String(
      lastDay,
    ).padStart(2, "0")}`,
  };
}

function getEmployeeName(expense) {
  const employee =
    expense.salary?.employee;

  if (!employee) {
    return null;
  }

  return (
    [
      employee.first_name,
      employee.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    employee.name ||
    "Employee"
  );
}

function ExpensesPage() {
  const routeLocation =
    useLocation();

  const { hasPermission } =
    useAuth();

  const canManage =
    hasPermission(
      "expenses.manage",
    );

  const canApprove =
    hasPermission(
      "expenses.approve",
    );

  const canPay =
    hasPermission("expenses.pay");

  const [expenses, setExpenses] =
    useState([]);

  const [meta, setMeta] =
    useState(null);

  const [options, setOptions] =
    useState({
      categories: [],
      locations: [],
    });

  const [filters, setFilters] =
    useState(emptyFilters);

  const [request, setRequest] =
    useState({
      page: 1,
      filters:
        buildRequestFilters(
          emptyFilters,
        ),
      version: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [actingId, setActingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      routeLocation.state?.message ??
        "",
    );

  useEffect(() => {
    const controller =
      new AbortController();

    api
      .get("/expenses/options", {
        signal:
          controller.signal,
      })
      .then((response) => {
        const data =
          response.data.data ?? {};

        setOptions({
          categories:
            Array.isArray(
              data.categories,
            )
              ? data.categories
              : [],

          locations:
            Array.isArray(
              data.locations,
            )
              ? data.locations
              : [],
        });
      })
      .catch((requestError) => {
        if (
          requestError.code !==
          "ERR_CANCELED"
        ) {
          setError(
            extractApiError(
              requestError,
              "Unable to load expense filters.",
            ),
          );
        }
      });

    return () =>
      controller.abort();
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    api
      .get("/expenses", {
        params: {
          page: request.page,
          ...request.filters,
        },
        signal:
          controller.signal,
      })
      .then((response) => {
        const body =
          response.data;

        setExpenses(
          Array.isArray(
            body.data,
          )
            ? body.data
            : [],
        );

        setMeta(body);
        setError("");
      })
      .catch((requestError) => {
        if (
          requestError.code !==
          "ERR_CANCELED"
        ) {
          setError(
            extractApiError(
              requestError,
              "Unable to load expenses.",
            ),
          );
        }
      })
      .finally(() => {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      });

    return () =>
      controller.abort();
  }, [request]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => setMessage(""),
        3500,
      );

    return () =>
      window.clearTimeout(timer);
  }, [message]);

  const handleFilterChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  const applyFilters = (
    event,
  ) => {
    event.preventDefault();

    setLoading(true);

    setRequest(
      (current) => ({
        page: 1,
        filters:
          buildRequestFilters(
            filters,
          ),
        version:
          current.version + 1,
      }),
    );
  };

  const resetFilters = () => {
    setFilters(
      emptyFilters,
    );

    setLoading(true);

    setRequest(
      (current) => ({
        page: 1,
        filters:
          buildRequestFilters(
            emptyFilters,
          ),
        version:
          current.version + 1,
      }),
    );
  };

  const changePage = (
    nextPage,
  ) => {
    setLoading(true);

    setRequest(
      (current) => ({
        ...current,
        page: nextPage,
        version:
          current.version + 1,
      }),
    );
  };

  const handleApprove = async (
    expense,
  ) => {
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

      const response =
        await api.patch(
          `/expenses/${expense.id}/approve`,
        );

      setMessage(
        response.data.message ??
          "Expense approved successfully.",
      );

      setLoading(true);

      setRequest(
        (current) => ({
          ...current,
          version:
            current.version + 1,
        }),
      );
    } catch (requestError) {
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

  const inputClass =
    "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ReceiptText size={26} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expenses and bills
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track operating costs,
              approvals, due dates,
              and payments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasPermission(
            "expense-categories.view",
          ) && (
            <Link
              to="/app/expense-categories"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Categories
            </Link>
          )}

          {canManage && (
            <Link
              to="/app/expenses/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Plus size={18} />
              Record expense
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              name="search"
              value={filters.search}
              onChange={
                handleFilterChange
              }
              placeholder="Search number, title or reference"
              className={`${inputClass} w-full pl-10`}
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={
              handleFilterChange
            }
            className={inputClass}
          >
            <option value="">
              All approval statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <select
            name="payment_status"
            value={
              filters.payment_status
            }
            onChange={
              handleFilterChange
            }
            className={inputClass}
          >
            <option value="">
              All payment statuses
            </option>

            <option value="unpaid">
              Unpaid
            </option>

            <option value="partially_paid">
              Partially paid
            </option>

            <option value="paid">
              Paid
            </option>
          </select>

          <select
            name="expense_category_id"
            value={
              filters.expense_category_id
            }
            onChange={
              handleFilterChange
            }
            className={inputClass}
          >
            <option value="">
              All categories
            </option>

            {options.categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          <select
            name="location_id"
            value={
              filters.location_id
            }
            onChange={
              handleFilterChange
            }
            className={inputClass}
          >
            <option value="">
              All locations
            </option>

            {options.locations.map(
              (location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                </option>
              ),
            )}
          </select>

          <input
            type="month"
            name="month"
            title="Expense month"
            aria-label="Expense month"
            value={filters.month}
            onChange={
              handleFilterChange
            }
            className={`${inputClass} xl:col-span-2`}
          />
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={
              resetFilters
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply filters
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  Expense
                </th>

                <th className="px-5 py-4">
                  Category
                </th>

                <th className="px-5 py-4">
                  Assignment
                </th>

                <th className="px-5 py-4">
                  Dates
                </th>

                <th className="px-5 py-4">
                  Total
                </th>

                <th className="px-5 py-4">
                  Balance
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    No expenses match
                    these filters.
                  </td>
                </tr>
              ) : (
                expenses.map(
                  (expense) => {
                    const employeeName =
                      getEmployeeName(
                        expense,
                      );

                    return (
                      <tr
                        key={
                          expense.id
                        }
                        className="hover:bg-slate-50/70"
                      >
                        {/* Expense */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {
                              expense.title
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {
                              expense.expense_number
                            }
                          </p>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {expense
                            .category
                            ?.name ??
                            "-"}
                        </td>

                        {/* Assignment */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          <p>
                            {expense
                              .location
                              ?.name ??
                              "Company-wide"}
                          </p>

                          {employeeName ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <UserRound
                                size={13}
                              />
                              {
                                employeeName
                              }
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400">
                              {expense
                                .supplier
                                ?.name ??
                                "No supplier"}
                            </p>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="px-5 py-4 text-sm text-slate-600">
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
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {formatMoney(
                            expense.total_ttc,
                          )}{" "}
                          MAD
                        </td>

                        {/* Balance */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {formatMoney(
                              expense.remaining_amount,
                            )}{" "}
                            MAD
                          </p>

                          <div className="mt-1">
                            <PaymentStatusBadge
                              status={
                                expense.payment_status
                              }
                              overdue={
                                expense.is_overdue
                              }
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <ExpenseStatusBadge
                            status={
                              expense.status
                            }
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/app/expenses/${expense.id}`}
                              title="View expense"
                              className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                            >
                              <Eye
                                size={17}
                              />
                            </Link>

                            {canManage &&
                              expense.status ===
                                "draft" && (
                                <Link
                                  to={`/app/expenses/${expense.id}/edit`}
                                  title="Edit expense"
                                  className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                >
                                  <FilePenLine
                                    size={17}
                                  />
                                </Link>
                              )}

                            {canApprove &&
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
                                  className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  <CheckCircle2
                                    size={17}
                                  />
                                </button>
                              )}

                            {canPay &&
                              expense.status ===
                                "approved" &&
                              expense.payment_status !==
                                "paid" && (
                                <Link
                                  to={`/app/expenses/${expense.id}/payments`}
                                  title="Record payment"
                                  className="rounded-lg bg-violet-50 p-2 text-violet-700 hover:bg-violet-100"
                                >
                                  <CreditCard
                                    size={17}
                                  />
                                </Link>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
            <span className="text-slate-500">
              {meta.total ??
                expenses.length}{" "}
              expenses
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={
                  !meta.prev_page_url
                }
                onClick={() =>
                  changePage(
                    Math.max(
                      request.page - 1,
                      1,
                    ),
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page{" "}
                {meta.current_page ??
                  1}{" "}
                of{" "}
                {meta.last_page ??
                  1}
              </span>

              <button
                type="button"
                disabled={
                  !meta.next_page_url
                }
                onClick={() =>
                  changePage(
                    request.page + 1,
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpensesPage;
