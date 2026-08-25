import {
  Download,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";

function DownloadSalaryPdfButton({
  salaryId,
  employeeName,
}) {
  const [loading, setLoading] =
    useState(false);

  const handleDownload = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/salaries/${salaryId}/pdf`,
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

      const safeEmployeeName = String(
        employeeName || "employee",
      )
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

      link.href = url;
      link.download =
        `salary-${safeEmployeeName}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Salary PDF download failed:",
        error,
      );

      window.alert(
        "Unable to download the salary PDF.",
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
      title="Download salary PDF"
      className="inline-flex items-center justify-center rounded-md bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
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

export default DownloadSalaryPdfButton;
