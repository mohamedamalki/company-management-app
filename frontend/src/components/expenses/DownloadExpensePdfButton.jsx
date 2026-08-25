import {
  Download,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";

function DownloadExpenseRowPdfButton({
  expense,
}) {
  const [loading, setLoading] =
    useState(false);

  const handleDownload = async () => {
    if (loading) {
      return;
    }

    const isSalaryRow = String(
      expense.id,
    ).startsWith("salary-");

    const recordId = isSalaryRow
      ? expense.salary_id
      : expense.id;

    const endpoint = isSalaryRow
      ? `/salaries/${recordId}/pdf`
      : `/expenses/${recordId}/pdf`;

    const filename = isSalaryRow
      ? `salary-${recordId}.pdf`
      : `expense-${expense.expense_number}.pdf`;

    try {
      setLoading(true);

      const response = await api.get(
        endpoint,
        {
          responseType: "blob",
          headers: {
            Accept: "application/pdf",
          },
        },
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        },
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "PDF download failed:",
        error,
      );

      window.alert(
        "Unable to download PDF.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      title="Download PDF"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2
          size={16}
          className="animate-spin"
        />
      ) : (
        <Download size={16} />
      )}
    </button>
  );
}

export default DownloadExpenseRowPdfButton;
