export function extractApiError(
  error,
  fallback,
) {
  const errors =
    error.response?.data?.errors;

  if (errors) {
    return Object.values(errors)
      .flat()
      .at(0);
  }

  return (
    error.response?.data?.message ??
    fallback
  );
}

export function formatMoney(value) {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatDate(
  value,
  options = {},
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    },
  ).format(date);
}

export function toDateInput(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

export function toDateTimeInput(
  value = new Date(),
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60_000,
  )
    .toISOString()
    .slice(0, 16);
}

export function getTaxPercentage(
  expense,
) {
  if (
    typeof expense?.tax_rate ===
      "number" ||
    typeof expense?.tax_rate ===
      "string"
  ) {
    return (
      Number(expense.tax_rate) || 0
    );
  }

  return (
    Number(
      expense?.tax_rate?.rate ??
        expense?.taxRate?.rate ??
        0,
    ) || 0
  );
}

export function getDocumentUrl(path) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const storageUrl =
    import.meta.env.VITE_STORAGE_URL ??
    "http://127.0.0.1:8000/storage";

  const base = storageUrl.replace(
    /\/$/,
    "",
  );

  const normalizedPath =
    String(path).replace(/^\//, "");

  return `${base}/${normalizedPath}`;
}

export function buildExpenseFormData(
  data,
  method = null,
) {
  const payload = new FormData();

  Object.entries(data).forEach(
    ([key, value]) => {
      if (key === "document") {
        if (value instanceof File) {
          payload.append(key, value);
        }

        return;
      }

      if (typeof value === "boolean") {
        payload.append(
          key,
          value ? "1" : "0",
        );

        return;
      }

      payload.append(
        key,
        value ?? "",
      );
    },
  );

  if (method) {
    payload.append("_method", method);
  }

  return payload;
}
