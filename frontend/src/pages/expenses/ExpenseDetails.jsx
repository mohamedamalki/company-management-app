import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FilePenLine,
  MapPin,
  ReceiptText,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
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
  getDocumentUrl,
  getTaxPercentage,
} from "../../components/expenses/expenseHelpers";
import useAuth from "../../context/useAuth";

function InfoCard({
  icon: Icon,
  label,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Icon size={16} />
        {label}
      </div>

      <div className="mt-3 text-sm text-slate-700">
        {children}
      </div>
    </div>
  );
}

function ExpenseDetails() {
  const { id } = useParams();
  const routeLocation = useLocation();

  const { hasPermission } = useAuth();

  const canManage =
    hasPermission("expenses.manage");

  const canApprove =
    hasPermission("expenses.approve");

  const canPay =
    hasPermission("expenses.pay");

  const [expense, setExpense] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [acting, setActing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      routeLocation.state?.message ?? "",
    );

  useEffect(() => {
    const controller =
      new AbortController();

    const loadExpense = async () => {
      try {
        const response = await api.get(
          `/expenses/${id}`,
          {
            signal:
              controller.signal,
          },
        );

        setExpense(
          response.data.data ?? null,
        );

        setError("");
      } catch (requestError) {
        if (
          requestError.code !==
          "ERR_CANCELED"
        ) {
          setError(
            extractApiError(
              requestError,
              "Unable to load expense.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadExpense();

    return () => controller.abort();
  }, [id]);

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

  const handleApprove = async () => {
    if (
      !window.confirm(
        `Approve expense ${expense.expense_number}?`,
      )
    ) {
      return;
    }

    try {
      setActing(true);
      setError("");

      const response = await api.patch(
        `/expenses/${id}/approve`,
      );

      setExpense(
        response.data.data,
      );

      setMessage(
        response.data.message ??
          "Expense approved successfully.",
      );
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Unable to approve expense.",
        ),
      );
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    const reason =
      window.prompt(
        "Enter the cancellation reason:",
      );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError(
        "The cancellation reason is required.",
      );
      return;
    }

    try {
      setActing(true);
      setError("");

      const response = await api.patch(
        `/expenses/${id}/cancel`,
        {
          cancellation_reason:
            reason.trim(),
        },
      );

      setExpense(
        response.data.data,
      );

      setMessage(
        response.data.message ??
          "Expense cancelled successfully.",
      );
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Unable to cancel expense.",
        ),
      );
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <p className="p-6 text-sm text-slate-500">
        Loading expense...
      </p>
    );
  }

  if (!expense) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Expense not found."}
      </div>
    );
  }

  const documentUrl =
    getDocumentUrl(
      expense.document_path,
    );

  const payments =
    Array.isArray(expense.payments)
      ? expense.payments
      : [];

  const salary =
    expense.salary ?? null;

  const employee =
    salary?.employee ?? null;

  const employeeName =
    [
      employee?.first_name,
      employee?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    employee?.name ||
    "Employee";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ReceiptText size={26} />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {expense.expense_number}
              </h1>

              <ExpenseStatusBadge
                status={expense.status}
              />

              <PaymentStatusBadge
                status={
                  expense.payment_status
                }
                overdue={
                  expense.is_overdue
                }
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {expense.title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/expenses"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          {canManage &&
            expense.status ===
              "draft" && (
              <Link
                to={`/app/expenses/${expense.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <FilePenLine
                  size={17}
                />
                Edit
              </Link>
            )}

          {canApprove &&
            expense.status ===
              "draft" && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={acting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2
                  size={17}
                />
                Approve
              </button>
            )}

          {canApprove &&
            expense.status !==
              "cancelled" &&
            payments.length === 0 && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={acting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={17} />
                Cancel
              </button>
            )}

          {canPay &&
            expense.status ===
              "approved" &&
            expense.payment_status !==
              "paid" && (
              <Link
                to={`/app/expenses/${expense.id}/payments`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <CreditCard
                  size={17}
                />
                Record payment
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

      {/* Information cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={ReceiptText}
          label="Category"
        >
          <p className="font-bold text-slate-900">
            {expense.category?.name ??
              "-"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {expense.bill_reference ||
              "No bill reference"}
          </p>
        </InfoCard>

        <InfoCard
          icon={MapPin}
          label="Location"
        >
          <p className="font-bold text-slate-900">
            {expense.location?.name ??
              "Company-wide"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {expense.supplier?.name ??
              "No supplier"}
          </p>
        </InfoCard>

        <InfoCard
          icon={CalendarDays}
          label="Dates"
        >
          <p className="font-bold text-slate-900">
            Issued{" "}
            {formatDate(
              expense.issue_date,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Due{" "}
            {formatDate(
              expense.due_date,
            )}
          </p>
        </InfoCard>

        <InfoCard
          icon={UserRound}
          label="Workflow"
        >
          <p className="font-bold text-slate-900">
            Created by{" "}
            {expense.creator?.name ??
              "-"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {expense.approver
              ? `Approved by ${expense.approver.name}`
              : "Waiting for approval"}
          </p>
        </InfoCard>
      </div>

      {/* Salary information */}
      {salary && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex items-center gap-3 border-b border-amber-200 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <WalletCards
                size={20}
              />
            </span>

            <div>
              <h2 className="font-bold text-slate-900">
                Salary expense
              </h2>

              <p className="text-xs text-slate-500">
                This expense is linked to a salary record.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Employee
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {employeeName}
              </p>

              {employee?.email && (
                <p className="mt-1 text-xs text-slate-500">
                  {employee.email}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Salary
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {formatMoney(
                  salary.net_salary ??
                    salary.amount ??
                    salary.net_amount ??
                    0,
                )}{" "}
                MAD
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Period
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {salary.period ??
                  salary.month ??
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Salary status
              </p>

              <p className="mt-1 font-bold capitalize text-slate-900">
                {salary.status ??
                  "Pending"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main information */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Expense information
            </h2>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Billing period
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {expense.period_start ||
                expense.period_end
                  ? `${formatDate(
                      expense.period_start,
                    )} – ${formatDate(
                      expense.period_end,
                    )}`
                  : "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Document
              </p>

              {documentUrl ? (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline"
                >
                  <Download
                    size={16}
                  />
                  Open supporting document
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  No document attached
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase text-slate-400">
                Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {expense.notes ||
                  "No notes."}
              </p>
            </div>

            {expense.status ===
              "cancelled" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase text-red-500">
                  Cancellation reason
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {
                    expense.cancellation_reason
                  }
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Financial summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Financial summary
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3 text-slate-600">
              <span>Amount HT</span>

              <strong className="text-slate-900">
                {formatMoney(
                  expense.amount_ht,
                )}{" "}
                MAD
              </strong>
            </div>

            <div className="flex justify-between gap-3 text-slate-600">
              <span>
                TVA (
                {getTaxPercentage(
                  expense,
                )}
                %)
              </span>

              <strong className="text-slate-900">
                {formatMoney(
                  expense.tax_amount,
                )}{" "}
                MAD
              </strong>
            </div>

            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base">
              <span className="font-bold text-slate-900">
                Total TTC
              </span>

              <strong className="text-blue-700">
                {formatMoney(
                  expense.total_ttc,
                )}{" "}
                MAD
              </strong>
            </div>

            <div className="flex justify-between gap-3 text-slate-600">
              <span>Paid</span>

              <strong className="text-emerald-700">
                {formatMoney(
                  expense.paid_amount,
                )}{" "}
                MAD
              </strong>
            </div>

            <div className="flex justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
              <span className="font-bold">
                Remaining
              </span>

              <strong>
                {formatMoney(
                  expense.remaining_amount,
                )}{" "}
                MAD
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* Payment history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="font-bold text-slate-900">
            Payment history
          </h2>

          <span className="text-xs font-semibold text-slate-400">
            {payments.length} payment
            {payments.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3">
                  Payment
                </th>

                <th className="px-6 py-3">
                  Date
                </th>

                <th className="px-6 py-3">
                  Method
                </th>

                <th className="px-6 py-3">
                  Reference
                </th>

                <th className="px-6 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {payments.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No payments recorded
                    yet.
                  </td>
                </tr>
              ) : (
                payments.map(
                  (payment) => (
                    <tr
                      key={
                        payment.id
                      }
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {
                          payment.payment_number
                        }
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(
                          payment.paid_at,
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payment
                          .payment_method
                          ?.name ??
                          "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payment.reference ||
                          "-"}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatMoney(
                          payment.amount,
                        )}{" "}
                        MAD
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ExpenseDetails;
