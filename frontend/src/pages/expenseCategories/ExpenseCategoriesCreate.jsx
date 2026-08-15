import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ExpenseCategoryForm from "../../components/expenseCategories/ExpenseCategoryForm";

function extractError(error, fallback) {
  const errors = error.response?.data?.errors;
  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function ExpenseCategoriesCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      setError("");
      await api.post("/expense-categories", data);
      navigate("/app/expense-categories", {
        state: { message: "Expense category created successfully." },
      });
    } catch (requestError) {
      setError(
        extractError(requestError, "Unable to create expense category."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExpenseCategoryForm
      onSubmit={handleCreate}
      saving={saving}
      error={error}
      submitText="Create category"
    />
  );
}

export default ExpenseCategoriesCreate;
