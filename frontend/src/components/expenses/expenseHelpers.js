export function extractApiError(error, fallback = "Something went wrong.") {
  const responseData = error?.response?.data;

  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)
      .flat()
      .find((message) => message);

    if (firstError) {
      return String(firstError);
    }
  }

  if (responseData?.message) {
    return String(responseData.message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return fallback;
}

export function formatMoney(value) {
  const amount = Number(value);

  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function toDateInput(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

export function toDateTimeInput(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function getTaxPercentage(expense) {
  const taxRate = expense?.tax_rate;

  // Example:
  // tax_rate: 20
  // tax_rate: "20"
  if (
    typeof taxRate === "number" ||
    typeof taxRate === "string"
  ) {
    const value = Number(taxRate);

    return Number.isFinite(value) ? value : 0;
  }

  // Example:
  // tax_rate: {
  //   rate: 20
  // }
  const nestedRate =
    taxRate?.rate ??
    expense?.taxRate?.rate ??
    expense?.tax_rate_percentage ??
    expense?.tax_percentage ??
    0;

  const value = Number(nestedRate);

  return Number.isFinite(value) ? value : 0;
}

export function getDocumentUrl(path) {
  if (!path) {
    return null;
  }

  const stringPath = String(path).trim();

  if (!stringPath) {
    return null;
  }

  // Already a complete URL.
  if (/^https?:\/\//i.test(stringPath)) {
    return stringPath;
  }

  const storageUrl =
    import.meta.env.VITE_STORAGE_URL ??
    "http://127.0.0.1:8000/storage";

  const base = storageUrl.replace(/\/+$/, "");

  const normalizedPath = stringPath.replace(/^\/+/, "");

  return `${base}/${normalizedPath}`;
}

/**
 * Convert expense form data to multipart/form-data.
 *
 * Handles:
 * - File uploads
 * - Boolean values
 * - null / undefined values
 * - Laravel method spoofing for PUT/PATCH
 */
export function buildExpenseFormData(data, method = null) {
  const payload = new FormData();

  Object.entries(data ?? {}).forEach(([key, value]) => {
    // Do not send the document when no new file was selected.
    if (key === "document") {
      if (value instanceof File) {
        payload.append("document", value);
      }

      return;
    }

    // Ignore undefined values.
    if (value === undefined) {
      return;
    }

    // Laravel handles boolean form values more reliably as 1/0.
    if (typeof value === "boolean") {
      payload.append(key, value ? "1" : "0");
      return;
    }

    // Arrays / objects should be JSON encoded if they are ever added
    // to the expense form.
    if (
      value !== null &&
      typeof value === "object"
    ) {
      payload.append(key, JSON.stringify(value));
      return;
    }

    payload.append(key, value ?? "");
  });

  // Laravel method spoofing.
  //
  // Important for multipart/form-data because:
  // POST + _method=PUT
  // is commonly used for file uploads.
  if (method) {
    payload.append("_method", method.toUpperCase());
  }

  return payload;
}

/**
 * Calculate expense tax and total.
 */
export function calculateExpenseTotals(
  amountHt,
  taxRate = 0,
) {
  const ht = Number(amountHt) || 0;
  const rate = Number(taxRate) || 0;

  const taxAmount = (ht * rate) / 100;
  const totalTtc = ht + taxAmount;

  return {
    amountHt: ht,
    taxRate: rate,
    taxAmount,
    totalTtc,
  };
}

/**
 * Return the employee's display name.
 *
 * Supports:
 * {
 *   name: "John Doe"
 * }
 *
 * and:
 * {
 *   first_name: "John",
 *   last_name: "Doe"
 * }
 */
export function getEmployeeName(employee) {
  if (!employee) {
    return "Employee";
  }

  if (employee.name) {
    return employee.name;
  }

  const fullName = [
    employee.first_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || "Employee";
}

/**
 * Return a safe salary display label.
 */
export function getSalaryLabel(salary) {
  if (!salary) {
    return "Salary";
  }

  const employeeName = getEmployeeName(
    salary.employee,
  );

  const amount = Number(
    salary.net_salary ??
      salary.net_amount ??
      salary.amount ??
      0,
  );

  if (amount > 0) {
    return `${employeeName} — ${formatMoney(amount)} MAD`;
  }

  return employeeName;
}
