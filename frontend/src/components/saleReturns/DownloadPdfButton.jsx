import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";

export default function DownloadPdfButton({
  saleReturnId,
  returnNumber,
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/sale-returns/${saleReturnId}/pdf`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        }),
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = `return-${returnNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "PDF download failed:",
        error,
      );

      alert("Unable to download PDF.");
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
      className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-50"
    >
      {loading ? (
        <Loader2
          size={17}
          className="animate-spin"
        />
      ) : (
        <Download size={17} />
      )}
    </button>
  );
}
