import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import DashboardLayout from "./layouts/DashboardLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import PermissionRoute from "./components/PermissionRoute";

import NotFoundPage from "./pages/NotFoundPage";

import UsersPage from "./pages/users/UsersPage";
import UsersCreate from "./pages/users/UsersCreate";
import UsersUpdate from "./pages/users/UsersUpdate";

import CategoriesPage from "./pages/categories/CategoriesPage";
import CategoriesCreate from "./pages/categories/CategoriesCreate";
import CategoriesUpdate from "./pages/categories/CategoriesUpdate";

import ProductsPage from "./pages/products/ProductsPage";
import ProductsCreate from "./pages/products/ProductsCreate";
import ProductsUpdate from "./pages/products/ProductsUpdate";

import LocationsPage from "./pages/locations/LocationsPage";
import LocationsCreate from "./pages/locations/LocationsCreate";
import LocationsUpdate from "./pages/locations/LocationsUpdate";

import BrandsPage from "./pages/brands/BrandsPage";
import BrandsCreate from "./pages/brands/BrandsCreate";
import BrandsUpdate from "./pages/brands/BrandsUpdate";

import LocationAssignmentsPage from "./pages/locationAssignments/LocationAssignmentsPage";

import PaymentMethodsPage from "./pages/paymentMethods/PaymentMethodsPage";
import PaymentMethodsCreate from "./pages/paymentMethods/PaymentMethodsCreate";
import PaymentMethodsUpdate from "./pages/paymentMethods/PaymentMethodsUpdate";

import TaxRatesPage from "./pages/taxRates/TaxRatesPage";
import TaxRatesCreate from "./pages/taxRates/TaxRatesCreate";
import TaxRatesUpdate from "./pages/taxRates/TaxRatesUpdate";

import ProductPricesPage from "./pages/productPrices/ProductPricesPage";
import ProductPricesCreate from "./pages/productPrices/ProductPricesCreate";
import ProductPricesUpdate from "./pages/productPrices/ProductPricesUpdate";

import SuppliersPage from "./pages/suppliers/SuppliersPage";
import SuppliersCreate from "./pages/suppliers/SuppliersCreate";
import SuppliersUpdate from "./pages/suppliers/SuppliersUpdate";

import PurchaseOrdersPage from "./pages/purchaseOrders/PurchaseOrdersPage";
import PurchaseOrdersCreate from "./pages/purchaseOrders/PurchaseOrdersCreate";
import PurchaseOrdersUpdate from "./pages/purchaseOrders/PurchaseOrdersUpdate";
import PurchaseOrderDetails from "./pages/purchaseOrders/PurchaseOrdersDetails";

import UserPermissionsPage from "./pages/permissions/UserPermissionsPage";
import LocationStocksPage from "./pages/locationStocks/LocationStocksPage";
import LocationStocksCreate from "./pages/locationStocks/LocationStocksCreate";
import LocationStocksUpdateMinimum from "./pages/locationStocks/LocationStocksUpdateMinimum";
import StockMovementsPage from "./pages/stockMovements/StockMovementsPage";
import StockMovementsCreate from "./pages/stockMovements/StockMovementsCreate";
import PurchaseReceiptsPage from "./pages/purchaseReceipts/PurchaseReceiptsPage";
import PurchaseReceiptDetails from "./pages/purchaseReceipts/PurchaseReceiptDetails";
import PurchaseReceiptsCreate from "./pages/purchaseReceipts/PurchaseReceiptsCreate";
import PurchaseReceiptsUpdate from "./pages/purchaseReceipts/PurchaseReceiptsUpdate";
import CustomersPage from "./pages/customers/CustomersPage";
import CustomersCreate from "./pages/customers/CustomersCreate";
import CustomersUpdate from "./pages/customers/CustomersUpdate";

import SalesPage from "./pages/sales/SalesPage";
import SalesCreate from "./pages/sales/SalesCreate";
import SalesUpdate from "./pages/sales/SalesUpdate";
import SaleDetails from "./pages/sales/SaleDetails";
import FournisseursCreate from "./pages/fournisseurs/FournisseursCreate";
import FournisseursUpdate from "./pages/fournisseurs/FournisseursUpdate";
import FournisseursPage from "./pages/fournisseurs/FournisseursPage";
import FournisseurDetails from "./pages/fournisseurs/FournisseursDetails";
import SaleBalancesPage from "./pages/salePayments/SaleBalancesPage";
import SalePaymentsPage from "./pages/salePayments/SalePaymentsPage";
import SaleReturnsPage from "./pages/saleReturns/SaleReturnsPage";
import SaleReturnDetails from "./pages/saleReturns/SaleReturnDetails";
import SaleReturnsCreate from "./pages/saleReturns/SaleReturnsCreate";
import SaleReturnsUpdate from "./pages/saleReturns/SaleReturnsUpdate";

import ExpenseCategoriesPage from "./pages/expenseCategories/ExpenseCategoriesPage";
import ExpenseCategoriesCreate from "./pages/expenseCategories/ExpenseCategoriesCreate";
import ExpenseCategoriesUpdate from "./pages/expenseCategories/ExpenseCategoriesUpdate";

import ExpensesPage from "./pages/expenses/ExpensesPage";
import ExpensesCreate from "./pages/expenses/ExpensesCreate";
import ExpensesUpdate from "./pages/expenses/ExpensesUpdate";
import ExpenseDetails from "./pages/expenses/ExpenseDetails";
import ExpensePaymentsPage from "./pages/expenses/ExpensePaymentsPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeesCreate from "./pages/employees/EmployeesCreate";
import EmployeesUpdate from "./pages/employees/EmployeesUpdate";
import SalariesPage from "./pages/salaries/SalariesPage";
import SalariesCreate from "./pages/salaries/SalariesCreate";
import SalariesUpdate from "./pages/salaries/SalariesUpdate";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      {/* Shared authenticated application */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Shared permission-aware dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Permission management */}
          <Route element={<PermissionRoute permission="permissions.manage" />}>
            <Route path="permissions" element={<UserPermissionsPage />} />
          </Route>

          {/* Users */}
          <Route element={<PermissionRoute permission="users.manage" />}>
            <Route path="users" element={<UsersPage />} />

            <Route path="users/create" element={<UsersCreate />} />

            <Route path="users/:id/edit" element={<UsersUpdate />} />
          </Route>

          {/* Locations */}
          <Route element={<PermissionRoute permission="locations.view" />}>
            <Route path="locations" element={<LocationsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="locations.manage" />}>
            <Route path="locations/create" element={<LocationsCreate />} />

            <Route path="locations/:id/edit" element={<LocationsUpdate />} />
          </Route>

          {/* Location assignments */}
          <Route
            element={<PermissionRoute permission="location-assignments.view" />}
          >
            <Route
              path="location-assignments"
              element={<LocationAssignmentsPage />}
            />
          </Route>

          {/* Categories */}
          <Route element={<PermissionRoute permission="categories.view" />}>
            <Route path="categories" element={<CategoriesPage />} />
          </Route>

          <Route element={<PermissionRoute permission="categories.manage" />}>
            <Route path="categories/create" element={<CategoriesCreate />} />

            <Route path="categories/:id/edit" element={<CategoriesUpdate />} />
          </Route>

          {/* Brands */}
          <Route element={<PermissionRoute permission="brands.view" />}>
            <Route path="brands" element={<BrandsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="brands.manage" />}>
            <Route path="brands/create" element={<BrandsCreate />} />

            <Route path="brands/:id/edit" element={<BrandsUpdate />} />
          </Route>

          {/* Products */}
          <Route element={<PermissionRoute permission="products.view" />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="products.manage" />}>
            <Route path="products/create" element={<ProductsCreate />} />

            <Route path="products/:id/edit" element={<ProductsUpdate />} />
          </Route>

          {/* Payment methods */}
          <Route
            element={<PermissionRoute permission="payment-methods.view" />}
          >
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
          </Route>

          <Route
            element={<PermissionRoute permission="payment-methods.manage" />}
          >
            <Route
              path="payment-methods/create"
              element={<PaymentMethodsCreate />}
            />

            <Route
              path="payment-methods/:id/edit"
              element={<PaymentMethodsUpdate />}
            />
          </Route>

          {/* Tax rates */}
          <Route element={<PermissionRoute permission="tax-rates.view" />}>
            <Route path="tax-rates" element={<TaxRatesPage />} />
          </Route>

          <Route element={<PermissionRoute permission="tax-rates.manage" />}>
            <Route path="tax-rates/create" element={<TaxRatesCreate />} />

            <Route path="tax-rates/:id/edit" element={<TaxRatesUpdate />} />
          </Route>

          {/* Product prices */}
          <Route element={<PermissionRoute permission="product-prices.view" />}>
            <Route path="product-prices" element={<ProductPricesPage />} />
          </Route>

          <Route
            element={<PermissionRoute permission="product-prices.manage" />}
          >
            <Route
              path="product-prices/create"
              element={<ProductPricesCreate />}
            />

            <Route
              path="product-prices/:id/edit"
              element={<ProductPricesUpdate />}
            />
          </Route>

          {/* Suppliers */}
          <Route element={<PermissionRoute permission="suppliers.view" />}>
            <Route path="suppliers" element={<SuppliersPage />} />
          </Route>

          <Route element={<PermissionRoute permission="suppliers.manage" />}>
            <Route path="suppliers/create" element={<SuppliersCreate />} />

            <Route path="suppliers/:id/edit" element={<SuppliersUpdate />} />
          </Route>

          {/* Purchase orders */}
          <Route
            element={<PermissionRoute permission="purchase-orders.view" />}
          >
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />

            <Route
              path="purchase-orders/:id"
              element={<PurchaseOrderDetails />}
            />
          </Route>

          <Route
            element={<PermissionRoute permission="purchase-orders.manage" />}
          >
            <Route
              path="purchase-orders/create"
              element={<PurchaseOrdersCreate />}
            />

            <Route
              path="purchase-orders/:id/edit"
              element={<PurchaseOrdersUpdate />}
            />
          </Route>

          {/* Location stocks — view */}
          <Route
            element={<PermissionRoute permission="location-stocks.view" />}
          >
            <Route path="location-stocks" element={<LocationStocksPage />} />
          </Route>

          {/* Location stocks — manage */}
          <Route
            element={<PermissionRoute permission="location-stocks.manage" />}
          >
            <Route
              path="location-stocks/create"
              element={<LocationStocksCreate />}
            />

            <Route
              path="location-stocks/:id/minimum-quantity"
              element={<LocationStocksUpdateMinimum />}
            />
          </Route>
          {/* Stock movements — view */}
          <Route
            element={<PermissionRoute permission="stock-movements.view" />}
          >
            <Route path="stock-movements" element={<StockMovementsPage />} />
          </Route>

          {/* Stock movements — manage */}
          <Route
            element={<PermissionRoute permission="stock-movements.manage" />}
          >
            <Route
              path="stock-movements/create"
              element={<StockMovementsCreate />}
            />
          </Route>

          <Route
            element={<PermissionRoute permission="purchase-receipts.view" />}
          >
            <Route
              path="purchase-receipts"
              element={<PurchaseReceiptsPage />}
            />

            <Route
              path="purchase-receipts/:id"
              element={<PurchaseReceiptDetails />}
            />
          </Route>

          <Route
            element={<PermissionRoute permission="purchase-receipts.manage" />}
          >
            <Route
              path="purchase-receipts/create"
              element={<PurchaseReceiptsCreate />}
            />

            <Route
              path="purchase-receipts/:id/edit"
              element={<PurchaseReceiptsUpdate />}
            />
          </Route>

          <Route element={<PermissionRoute permission="customers.view" />}>
            <Route path="customers" element={<CustomersPage />} />
          </Route>

          <Route element={<PermissionRoute permission="customers.manage" />}>
            <Route path="customers/create" element={<CustomersCreate />} />

            <Route path="customers/:id/edit" element={<CustomersUpdate />} />
          </Route>

          <Route element={<PermissionRoute permission="sales.view" />}>
            <Route path="sales" element={<SalesPage />} />

            <Route path="sales/:id" element={<SaleDetails />} />
          </Route>

          <Route element={<PermissionRoute permission="sales.manage" />}>
            <Route path="sales/create" element={<SalesCreate />} />

            <Route path="sales/:id/edit" element={<SalesUpdate />} />
          </Route>

          <Route element={<PermissionRoute permission="fournisseurs.view" />}>
            <Route path="fournisseurs" element={<FournisseursPage />} />

            <Route path="fournisseurs/:id" element={<FournisseurDetails />} />
          </Route>

          <Route element={<PermissionRoute permission="fournisseurs.manage" />}>
            <Route
              path="fournisseurs/create"
              element={<FournisseursCreate />}
            />

            <Route
              path="fournisseurs/:id/edit"
              element={<FournisseursUpdate />}
            />
          </Route>

          <Route element={<PermissionRoute permission="sale-payments.view" />}>
            <Route path="sale-balances" element={<SaleBalancesPage />} />

            <Route path="sales/:id/payments" element={<SalePaymentsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="sale-returns.view" />}>
  <Route path="sale-returns" element={<SaleReturnsPage />} />
  <Route path="sale-returns/:id" element={<SaleReturnDetails />} />
</Route>

<Route element={<PermissionRoute permission="sale-returns.manage" />}>
  <Route path="sale-returns/create" element={<SaleReturnsCreate />} />
  <Route path="sale-returns/:id/edit" element={<SaleReturnsUpdate />} />
</Route>

        {/* Expense categories */}
<Route
  element={<PermissionRoute permission="expense-categories.view" />}
>
  <Route
    path="expense-categories"
    element={<ExpenseCategoriesPage />}
  />
</Route>

<Route
  element={<PermissionRoute permission="expense-categories.manage" />}
>
  <Route
    path="expense-categories/create"
    element={<ExpenseCategoriesCreate />}
  />
  <Route
    path="expense-categories/:id/edit"
    element={<ExpenseCategoriesUpdate />}
  />
</Route>

{/* Expenses */}
<Route element={<PermissionRoute permission="expenses.view" />}>
  <Route path="expenses" element={<ExpensesPage />} />
  <Route path="expenses/:id" element={<ExpenseDetails />} />
</Route>

<Route element={<PermissionRoute permission="expenses.manage" />}>
  <Route path="expenses/create" element={<ExpensesCreate />} />
  <Route path="expenses/:id/edit" element={<ExpensesUpdate />} />
</Route>

<Route element={<PermissionRoute permission="expenses.pay" />}>
  <Route
    path="expenses/:id/payments"
    element={<ExpensePaymentsPage />}
  />
</Route>
        {/* Employees */}
<Route element={<PermissionRoute permission="employees.view" />}>
    <Route
        path="employees"
        element={<EmployeesPage />}
    />
</Route>

<Route element={<PermissionRoute permission="employees.manage" />}>
    <Route
        path="employees/create"
        element={<EmployeesCreate />}
    />

    <Route
        path="employees/:id/edit"
        element={<EmployeesUpdate />}
    />
</Route>
        {/* salaries */}
<Route element={<PermissionRoute permission="salaries.view" />}>
    <Route
        path="salaries"
        element={<SalariesPage />}
    />
</Route>

<Route element={<PermissionRoute permission="salaries.manage" />}>
    <Route
        path="salaries/create"
        element={<SalariesCreate />}
    />

    <Route
        path="salaries/:id/edit"
        element={<SalariesUpdate />}
    />
</Route>
          {/* Unknown authenticated route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Unknown public route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
