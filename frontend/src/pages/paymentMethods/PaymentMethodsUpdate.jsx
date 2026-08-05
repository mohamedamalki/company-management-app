import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import PaymentMethodForm from "../../components/paymentMethods/PaymentMethodForm";

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors).flat()[0];
  }

  return error.response?.data?.message ?? fallback;
}

function PaymentMethodsUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPaymentMethod = async () => {
      try {
        const response = await api.get(`/payment-methods/${id}`);

        const data =
          response.data.data ?? response.data.payment_method ?? response.data;

        if (!cancelled) {
          setPaymentMethod(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getErrorMessage(error, "Unable to load the payment method."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPaymentMethod();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.patch(`/payment-methods/${id}`, formData);

      navigate("/admin/payment-methods", {
        replace: true,
        state: {
          success:
            response.data?.message ?? "Payment method updated successfully.",
        },
      });
    } catch (error) {
      setError(getErrorMessage(error, "Unable to update the payment method."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading payment method...
          </p>
        </div>
      </div>
    );
  }

  if (!paymentMethod) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "Payment method not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            to="/admin/payment-methods"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to payment methods
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <CreditCard size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Update payment method
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Change the method settings and availability.
              </p>
            </div>
          </div>
        </div>

        <PaymentMethodForm
          initialData={paymentMethod}
          onSubmit={handleUpdate}
          saving={saving}
          error={error}
          submitText="Update payment method"
        />
      </div>
    </div>
  );
}

export default PaymentMethodsUpdate;
