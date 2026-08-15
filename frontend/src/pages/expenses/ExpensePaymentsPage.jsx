import { ArrowLeft, CreditCard, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ExpensePaymentForm from "../../components/expenses/ExpensePaymentForm";
import { PaymentStatusBadge } from "../../components/expenses/ExpenseBadges";
import {
  extractApiError,
  formatDate,
  formatMoney,
} from "../../components/expenses/expenseHelpers";

function ExpensePaymentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.get(`/expenses/${id}/payments`, { signal: controller.signal }),
      api.get("/expenses/options", { signal: controller.signal }),
    ])
      .then(([paymentsResponse, optionsResponse]) => {
        const paymentData = paymentsResponse.data.data ?? {};
        const optionsData = optionsResponse.data.data ?? {};

        setExpense(paymentData.expense ?? null);
        setPayments(
          Array.isArray(paymentData.payments) ? paymentData.payments : [],
        );
        setPaymentMethods(
          Array.isArray(optionsData.payment_methods)
            ? optionsData.payment_methods
            : [],
        );
        setError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            extractApiError(requestError, "Unable to load expense payments."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const handlePayment = async (data) => {
    try {
      setSaving(true);
      setError("");
      await api.post(`/expenses/${id}/payments`, data);
      navigate(`/app/expenses/${id}`, {
        state: { message: "Expense payment recorded successfully." },
      });
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Unable to record expense payment."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading payments...</p>;
  }

  if (!expense) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Expense not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <CreditCard size={25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Expense payment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {expense.expense_number} — {expense.title}
            </p>
          </div>
        </div>
        <Link
          to={`/app/expenses/${id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={17} /> Back
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">
            Total TTC
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {formatMoney(expense.total_ttc)} MAD
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Paid</p>
          <p className="mt-2 text-xl font-extrabold text-emerald-700">
            {formatMoney(expense.paid_amount)} MAD
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">
            Remaining
          </p>
          <p className="mt-2 text-xl font-extrabold text-red-700">
            {formatMoney(expense.remaining_amount)} MAD
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Status</p>
          <div className="mt-2">
            <PaymentStatusBadge
              status={expense.payment_status}
              overdue={expense.is_overdue}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <ExpensePaymentForm
          key={`${expense.id}-${expense.remaining_amount}`}
          expense={expense}
          paymentMethods={paymentMethods}
          onSubmit={handlePayment}
          saving={saving}
          error={error}
        />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <ReceiptText size={18} />
            <h2 className="font-bold text-slate-900">Previous payments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                No payments recorded yet.
              </p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {payment.payment_method?.name ?? "Payment"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(payment.paid_at, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </p>
                  </div>
                  <p className="font-extrabold text-emerald-700">
                    {formatMoney(payment.amount)} MAD
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ExpensePaymentsPage;
