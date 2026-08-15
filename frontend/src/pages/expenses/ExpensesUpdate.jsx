import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import {
  buildExpenseFormData,
  extractApiError,
} from "../../components/expenses/expenseHelpers";

function ExpensesUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get(`/expenses/${id}`, { signal: controller.signal })
      .then((response) => setExpense(response.data.data ?? null))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(extractApiError(requestError, "Unable to load expense."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      setSaving(true);
      setError("");

      await api.post(`/expenses/${id}`, buildExpenseFormData(data, "PUT"));

      navigate(`/app/expenses/${id}`, {
        state: { message: "Expense updated successfully." },
      });
    } catch (requestError) {
      setError(extractApiError(requestError, "Unable to update expense."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading expense...</p>;
  }

  if (!expense) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Expense not found."}
      </div>
    );
  }

  return (
    <ExpenseForm
      key={expense.id}
      initialData={expense}
      onSubmit={handleUpdate}
      saving={saving}
      error={error}
      submitText="Update expense"
    />
  );
}

export default ExpensesUpdate;
