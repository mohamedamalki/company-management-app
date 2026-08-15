import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import {
  buildExpenseFormData,
  extractApiError,
} from "../../components/expenses/expenseHelpers";

function ExpensesCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.post("/expenses", buildExpenseFormData(data));

      navigate(`/app/expenses/${response.data.data.id}`, {
        state: { message: "Expense created successfully." },
      });
    } catch (requestError) {
      setError(extractApiError(requestError, "Unable to create expense."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExpenseForm
      onSubmit={handleCreate}
      saving={saving}
      error={error}
      submitText="Create expense"
    />
  );
}

export default ExpensesCreate;
