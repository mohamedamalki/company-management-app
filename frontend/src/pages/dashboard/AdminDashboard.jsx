import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const emptyAnalytics = {
  periodLabel: "",
  summary: {
    revenueTtc: 0,
    netRevenueTtc: 0,
    salesCount: 0,
    productsSold: 0,
    purchaseTotalTtc: 0,
    purchasesCount: 0,
    returnsTotalTtc: 0,
    returnsCount: 0,
    stockQuantity: 0,
    stockValueHt: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  },
  comparison: {
    revenueChange: null,
    salesChange: null,
    productsSoldChange: null,
    purchaseChange: null,
  },
  chart: [],
  topProducts: [],
  locationPerformance: [],
  recentActivity: [],
};

const moneyFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("fr-MA", {
  maximumFractionDigits: 3,
});

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return moneyFormatter.format(toNumber(value));
}

function formatNumber(value) {
  return numberFormatter.format(toNumber(value));
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function defaultDateValue(period) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  if (period === "day") return `${year}-${month}-${day}`;
  if (period === "year") return String(year);
  return `${year}-${month}`;
}

function getLocations(response) {
  const body = response.data;
  const collection = body?.data?.locations ?? body?.locations ?? body?.data;
  return Array.isArray(collection) ? collection : [];
}

function normalizeAnalytics(response) {
  const data = response.data?.data ?? response.data ?? {};
  const summary = data.summary ?? {};
  const comparison = data.comparison ?? {};

  const nullableNumber = (value) =>
    value === null || value === undefined ? null : toNumber(value);

  return {
    periodLabel: data.period_label ?? "",
    summary: {
      revenueTtc: toNumber(summary.revenue_ttc),
      netRevenueTtc: toNumber(summary.net_revenue_ttc ?? summary.revenue_ttc),
      salesCount: toNumber(summary.sales_count),
      productsSold: toNumber(summary.products_sold),
      purchaseTotalTtc: toNumber(summary.purchase_total_ttc),
      purchasesCount: toNumber(summary.purchases_count),
      returnsTotalTtc: toNumber(summary.returns_total_ttc),
      returnsCount: toNumber(summary.returns_count),
      stockQuantity: toNumber(summary.stock_quantity),
      stockValueHt: toNumber(summary.stock_value_ht),
      lowStockCount: toNumber(summary.low_stock_count),
      outOfStockCount: toNumber(summary.out_of_stock_count),
    },
    comparison: {
      revenueChange: nullableNumber(comparison.revenue_change),
      salesChange: nullableNumber(comparison.sales_change),
      productsSoldChange: nullableNumber(comparison.products_sold_change),
      purchaseChange: nullableNumber(comparison.purchase_change),
    },
    chart: Array.isArray(data.chart) ? data.chart : [],
    topProducts: Array.isArray(data.top_products) ? data.top_products : [],
    locationPerformance: Array.isArray(data.location_performance)
      ? data.location_performance
      : [],
    recentActivity: Array.isArray(data.recent_activity)
      ? data.recent_activity
      : [],
  };
}

function ChangeBadge({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-slate-400">No previous data</span>;
  }

  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      <Icon size={13} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  change,
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-slate-100/70 transition group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </span>
        <ChangeBadge value={change} />
      </div>

      <div className="relative mt-5">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-11 w-11 rounded-xl bg-slate-200" />
            <div className="mt-5 h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-36 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </>
  );
}

function AnalyticsChart({ data }) {
  const width = 760;
  const height = 270;
  const paddingX = 42;
  const paddingTop = 24;
  const paddingBottom = 44;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = data.flatMap((item) => [
    toNumber(item.revenue_ttc),
    toNumber(item.purchase_total_ttc),
  ]);
  const maximum = Math.max(...values, 1);
  const stepX =
    data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

  const pointsFor = (key) =>
    data
      .map((item, index) => {
        const x = paddingX + index * stepX;
        const y =
          paddingTop +
          chartHeight -
          (toNumber(item[key]) / maximum) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center text-center">
        <ChartNoAxesCombined size={38} className="text-slate-300" />
        <p className="mt-3 font-semibold text-slate-700">No activity yet</p>
        <p className="mt-1 text-sm text-slate-500">
          No sales or purchases were recorded for this period.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Sales
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Purchases
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[650px]"
          role="img"
          aria-label="Sales and purchases trend"
        >
          <defs>
            <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * ratio;
            const labelValue = maximum * (1 - ratio);

            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 5"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {labelValue >= 1000
                    ? `${(labelValue / 1000).toFixed(0)}k`
                    : labelValue.toFixed(0)}
                </text>
              </g>
            );
          })}

          {data.length > 1 && (
            <polygon
              points={`${paddingX},${paddingTop + chartHeight} ${pointsFor(
                "revenue_ttc",
              )} ${width - paddingX},${paddingTop + chartHeight}`}
              fill="url(#salesArea)"
            />
          )}

          <polyline
            points={pointsFor("revenue_ttc")}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={pointsFor("purchase_total_ttc")}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((item, index) => {
            const x = paddingX + index * stepX;
            const salesY =
              paddingTop +
              chartHeight -
              (toNumber(item.revenue_ttc) / maximum) * chartHeight;
            const purchaseY =
              paddingTop +
              chartHeight -
              (toNumber(item.purchase_total_ttc) / maximum) * chartHeight;

            return (
              <g key={`${item.label}-${index}`}>
                <circle cx={x} cy={salesY} r="4" fill="#2563eb" />
                <circle cx={x} cy={purchaseY} r="4" fill="#8b5cf6" />
                <text
                  x={x}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function TopProducts({ products }) {
  const maximum = Math.max(
    ...products.map((product) => toNumber(product.quantity_sold)),
    1,
  );

  if (products.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Package size={34} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No products sold in this period
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {products.slice(0, 5).map((product, index) => {
        const percentage = (toNumber(product.quantity_sold) / maximum) * 100;

        return (
          <div key={product.product_id ?? index}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {product.reference ?? "No reference"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-slate-900">
                  {formatNumber(product.quantity_sold)} {product.unit}
                </p>
                <p className="text-xs text-slate-400">
                  {formatMoney(product.revenue_ttc)}
                </p>
              </div>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                style={{ width: `${Math.max(percentage, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityIcon({ type }) {
  const settings = {
    sale: [ShoppingCart, "bg-emerald-50 text-emerald-700"],
    purchase_receipt: [ClipboardList, "bg-violet-50 text-violet-700"],
    sale_return: [RotateCcw, "bg-amber-50 text-amber-700"],
    stock_movement: [Boxes, "bg-blue-50 text-blue-700"],
  };
  const [Icon, className] = settings[type] ?? [
    Clock3,
    "bg-slate-100 text-slate-600",
  ];

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${className}`}
    >
      <Icon size={17} />
    </span>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [period, setPeriod] = useState("month");
  const [dateValue, setDateValue] = useState(() => defaultDateValue("month"));
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/dashboard/options", { signal: controller.signal })
      .then((response) => setLocations(getLocations(response)))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            apiError(requestError, "Unable to load dashboard locations."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/dashboard/analytics", {
        params: {
          location_id: locationId || undefined,
          period,
          date: dateValue,
        },
        signal: controller.signal,
      })
      .then((response) => {
        setAnalytics(normalizeAnalytics(response));
        setError("");
        setUpdatedAt(new Date());
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            apiError(requestError, "Unable to load dashboard analytics."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [locationId, period, dateValue, refreshKey]);

  const selectedLocation = useMemo(
    () => locations.find((location) => String(location.id) === locationId),
    [locations, locationId],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => currentYear - index);
  }, []);

  const selectLocation = (event) => {
    setLoading(true);
    setLocationId(event.target.value);
  };

  const selectPeriod = (newPeriod) => {
    if (newPeriod === period) return;
    setLoading(true);
    setPeriod(newPeriod);
    setDateValue(defaultDateValue(newPeriod));
  };

  const selectDate = (event) => {
    setLoading(true);
    setDateValue(event.target.value);
  };

  const refresh = () => {
    setLoading(true);
    setRefreshKey((current) => current + 1);
  };

  const { summary, comparison } = analytics;
  const locationLabel = selectedLocation?.name ?? "All locations";

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#071a3a] px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <ChartNoAxesCombined size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Operational intelligence
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Depots performance
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Welcome, {user?.name ?? "Admin"}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current view
              </p>
              <p className="mt-0.5 text-sm font-bold">{locationLabel}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-blue-50 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Building2 size={15} /> Location
            </label>
            <div className="relative">
              <select
                value={locationId}
                onChange={selectLocation}
                disabled={optionsLoading}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {optionsLoading ? "Loading locations..." : "All locations"}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} — {location.code}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CalendarDays size={15} /> Analysis period
            </label>
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {["day", "month", "year"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectPeriod(item)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-bold capitalize transition ${
                    period === item
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Selected {period}
            </label>
            {period === "year" ? (
              <select
                value={dateValue}
                onChange={selectDate}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={period === "day" ? "date" : "month"}
                value={dateValue}
                onChange={selectDate}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 xl:min-w-56">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Displayed period
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {analytics.periodLabel || dateValue}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Net sales revenue"
              value={formatMoney(summary.netRevenueTtc)}
              description={`${formatMoney(summary.returnsTotalTtc)} returned during this period`}
              icon={CircleDollarSign}
              iconClass="bg-blue-50 text-blue-700"
              change={comparison.revenueChange}
            />
            <MetricCard
              title="Confirmed sales"
              value={formatNumber(summary.salesCount)}
              description={`${formatNumber(summary.productsSold)} product units sold`}
              icon={ShoppingCart}
              iconClass="bg-emerald-50 text-emerald-700"
              change={comparison.salesChange}
            />
            <MetricCard
              title="Purchases received"
              value={formatMoney(summary.purchaseTotalTtc)}
              description={`${formatNumber(summary.purchasesCount)} supplier receipts`}
              icon={ReceiptText}
              iconClass="bg-violet-50 text-violet-700"
              change={comparison.purchaseChange}
            />
            <MetricCard
              title="Stock value HT"
              value={formatMoney(summary.stockValueHt)}
              description={`${formatNumber(summary.stockQuantity)} units currently in stock`}
              icon={Warehouse}
              iconClass="bg-amber-50 text-amber-700"
              change={null}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <MiniMetric
              title="Low-stock products"
              value={summary.lowStockCount}
              icon={AlertTriangle}
              color="amber"
            />
            <MiniMetric
              title="Out of stock"
              value={summary.outOfStockCount}
              icon={Boxes}
              color="red"
            />
            <MiniMetric
              title="Validated returns"
              value={summary.returnsCount}
              icon={RotateCcw}
              color="cyan"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                title="Sales and purchasing trend"
                description="Financial movement across the selected period."
                icon={TrendingUp}
              />
              <div className="p-5 sm:p-6">
                <AnalyticsChart data={analytics.chart} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Best-selling products
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ranked by sold quantity.
                  </p>
                </div>
                <Package size={20} className="text-slate-400" />
              </div>
              <div className="mt-6">
                <TopProducts products={analytics.topProducts} />
              </div>
            </div>
          </section>

          {locationId === "" && analytics.locationPerformance.length > 0 && (
            <LocationComparison locations={analytics.locationPerformance} />
          )}

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <RecentActivity activities={analytics.recentActivity} />
            <QuickLinks />
          </section>
        </>
      )}

      <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
        {loading && <Loader2 size={13} className="animate-spin" />}
        Last updated: {updatedAt ? formatDateTime(updatedAt) : "Not loaded"}
      </div>
    </div>
  );
}

function MiniMetric({ title, value, icon: Icon, color }) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-extrabold text-slate-900">
          {formatNumber(value)}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Icon size={21} className="text-blue-600" />
    </div>
  );
}

function LocationComparison({ locations }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SectionHeader
        title="Location comparison"
        description="Compare every depot and store in one view."
        icon={Building2}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4 sm:px-6">Location</th>
              <th className="px-5 py-4">Net revenue</th>
              <th className="px-5 py-4">Sales</th>
              <th className="px-5 py-4">Units sold</th>
              <th className="px-5 py-4">Stock units</th>
              <th className="px-5 py-4">Low stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.map((location) => (
              <tr key={location.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Warehouse size={17} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {location.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {location.code} · {location.type}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-bold">
                  {formatMoney(location.net_revenue_ttc)}
                </td>
                <td className="px-5 py-4">
                  {formatNumber(location.sales_count)}
                </td>
                <td className="px-5 py-4">
                  {formatNumber(location.products_sold)}
                </td>
                <td className="px-5 py-4">
                  {formatNumber(location.stock_quantity)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      toNumber(location.low_stock_count) > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {formatNumber(location.low_stock_count)} products
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentActivity({ activities }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-slate-900">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest operations in the selected scope.
          </p>
        </div>
        <Clock3 size={20} className="text-slate-400" />
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {activities.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No recent activity for this selection.
          </p>
        ) : (
          activities.slice(0, 7).map((activity) => (
            <div
              key={`${activity.type}-${activity.id}`}
              className="flex items-center gap-3 py-3.5"
            >
              <ActivityIcon type={activity.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {activity.title}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {activity.subtitle}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {activity.amount !== null && activity.amount !== undefined && (
                  <p className="text-sm font-bold text-slate-800">
                    {formatMoney(activity.amount)}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  {formatDateTime(activity.occurred_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickLinks() {
  const links = [
    ["Sales", "/app/sales", ShoppingCart],
    ["Location stocks", "/app/location-stocks", Warehouse],
    ["Purchase receipts", "/app/purchase-receipts", ClipboardList],
    ["Sale returns", "/app/sale-returns", RotateCcw],
  ];

  return (
    <aside className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
        <ChartNoAxesCombined size={21} />
      </div>
      <h2 className="mt-5 text-xl font-extrabold">
        Explore detailed operations
      </h2>
      <p className="mt-2 text-sm leading-6 text-blue-100">
        Review individual sales, stock balances, purchase receipts, and returns.
      </p>

      <div className="mt-6 space-y-2">
        {links.map(([title, path, Icon]) => (
          <Link
            key={path}
            to={path}
            className="group flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/10 transition hover:bg-white/20"
          >
            <Icon size={17} />
            <span className="flex-1">{title}</span>
            <ArrowRight
              size={16}
              className="transition group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default AdminDashboard;
