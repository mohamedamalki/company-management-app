import { useEffect, useState } from "react";
import {
  Link,
  useLocation as useRouteLocation,
  useNavigate,
} from "react-router-dom";
import {
  BadgeDollarSign,
  BadgePercent,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import api from "../../api/axios";

const moneyFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
});

const getCurrentPrice = (product) =>
  product.current_global_price ?? product.currentGlobalPrice ?? null;

const getTaxRate = (price) => price?.tax_rate ?? price?.taxRate ?? null;

const getTiers = (price) => {
  const tiers =
    price?.tiers ??
    price?.product_price_tiers ??
    price?.productPriceTiers ??
    [];

  return Array.isArray(tiers)
    ? [...tiers].sort(
        (firstTier, secondTier) =>
          Number(firstTier.min_quantity) - Number(secondTier.min_quantity),
      )
    : [];
};

const calculateTtc = (price) => {
  if (!price) {
    return 0;
  }

  const salePriceHt = Number(price.sale_price_ht ?? 0);
  const rate = Number(getTaxRate(price)?.rate ?? 0);

  return salePriceHt * (1 + rate / 100);
};

function ProductPricesPage() {
  const routeLocation = useRouteLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(routeLocation.state?.success ?? "");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccess("");
      navigate(routeLocation.pathname, {
        replace: true,
        state: null,
      });
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, routeLocation.pathname, success]);

  useEffect(() => {
    let cancelled = false;

    const loadCatalogue = async () => {
      try {
        const response = await api.get("/products", {
          params: {
            page,
            per_page: 15,
          },
        });

        const data = response.data;

        if (!cancelled) {
          setProducts(Array.isArray(data.data) ? data.data : []);
          setPagination({
            currentPage: data.current_page ?? 1,
            lastPage: data.last_page ?? 1,
            total: data.total ?? 0,
          });
        }
      } catch (requestError) {
        console.error("Unable to load pricing catalogue:", requestError);

        if (!cancelled) {
          setError(
            requestError.response?.data?.message ??
              "Unable to load the pricing catalogue.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.lastPage || newPage === page) {
      return;
    }

    setError("");
    setLoading(true);
    setPage(newPage);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <BadgeDollarSign size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Product prices
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Every product appears here, including products whose prices are
                not configured yet.
              </p>
            </div>
          </div>

          <Link
            to="/app/product-prices/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Create price
          </Link>
        </div>

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Brand</th>
                  <th className="px-5 py-3.5 font-semibold">Price HT</th>
                  <th className="px-5 py-3.5 font-semibold">Bulk tiers</th>
                  <th className="px-5 py-3.5 font-semibold">TVA</th>
                  <th className="px-5 py-3.5 font-semibold">Price TTC</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-12 text-center">
                      <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading product prices...
                      </p>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-12 text-center">
                      <BadgeDollarSign
                        size={32}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-medium text-slate-700">
                        No products found
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const currentPrice = getCurrentPrice(product);
                    const hasPrice = Boolean(currentPrice?.id);
                    const taxRate = hasPrice ? getTaxRate(currentPrice) : null;
                    const tiers = hasPrice ? getTiers(currentPrice) : [];

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {product.reference ?? "No reference"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <Tags size={15} className="text-slate-400" />
                            {product.category?.name ?? "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {product.brand?.name ?? "-"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                          {moneyFormatter.format(
                            Number(hasPrice ? currentPrice.sale_price_ht : 0),
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {tiers.length > 0 ? (
                            <div className="flex min-w-44 flex-wrap gap-1.5">
                              {tiers.map((tier) => (
                                <span
                                  key={tier.id ?? tier.min_quantity}
                                  className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                                >
                                  {tier.min_quantity}+ ·{" "}
                                  {moneyFormatter.format(
                                    Number(tier.unit_price_ht ?? 0),
                                  )}
                                  /unit
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Base price only
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {taxRate ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <BadgePercent size={14} />
                              {taxRate.rate}%
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-blue-700">
                          {moneyFormatter.format(
                            hasPrice ? calculateTtc(currentPrice) : 0,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              hasPrice
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {hasPrice ? "Configured" : "Not configured"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={
                              hasPrice
                                ? `/app/product-prices/${currentPrice.id}/edit`
                                : `/app/product-prices/create?product_id=${product.id}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              hasPrice
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {hasPrice ? (
                              <Pencil size={14} />
                            ) : (
                              <Plus size={14} />
                            )}
                            {hasPrice ? "Correct" : "Set price"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {pagination.total} product
                {pagination.total !== 1 ? "s" : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-600">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.lastPage}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ProductPricesPage;
