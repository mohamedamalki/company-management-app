import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ExpenseCategoryForm from "../../components/expenseCategories/ExpenseCategoryForm";

function extractError(error, fallback) {
  const errors = error.response?.data?.errors;
  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function ExpenseCategoriesUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get(`/expense-categories/${id}`, { signal: controller.signal })
      .then((response) => setCategory(response.data.data ?? null))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            extractError(requestError, "Unable to load expense category."),
          );
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
      await api.put(`/expense-categories/${id}`, data);
      navigate("/app/expense-categories", {
        state: { message: "Expense category updated successfully." },
      });
    } catch (requestError) {
      setError(
        extractError(requestError, "Unable to update expense category."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading category...</p>;
  }

  if (!category) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Expense category not found."}
      </div>
    );
  }

  return (
    <ExpenseCategoryForm
      key={category.id}
      initialData={category}
      onSubmit={handleUpdate}
      saving={saving}
      error={error}
      submitText="Update category"
    />
  );
}

export default ExpenseCategoriesUpdate;
