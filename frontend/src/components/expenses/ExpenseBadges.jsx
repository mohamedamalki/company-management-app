const expenseStyles = {
  draft: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentStyles = {
  unpaid: "bg-red-100 text-red-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

function label(value) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ExpenseStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        expenseStyles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label(status)}
    </span>
  );
}

export function PaymentStatusBadge({ status, overdue = false }) {
  if (overdue && status !== "paid") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
        Overdue
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        paymentStyles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label(status)}
    </span>
  );
}
