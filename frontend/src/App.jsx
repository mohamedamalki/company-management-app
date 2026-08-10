import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

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

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route element={<GuestRoute />}>
                <Route
                    path="/login"
                    element={<Login />}
                />
            </Route>

            <Route
                path="/"
                element={
                    <Navigate
                        to="/app/dashboard"
                        replace
                    />
                }
            />

            {/* Shared authenticated application */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="/app"
                    element={<DashboardLayout />}
                >
                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    {/* Shared permission-aware dashboard */}
                    <Route
                        path="dashboard"
                        element={<AdminDashboard />}
                    />

                    {/* Permission management */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="permissions.manage"
                            />
                        }
                    >
                        <Route
                            path="permissions"
                            element={
                                <UserPermissionsPage />
                            }
                        />
                    </Route>

                    {/* Users */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="users.manage"
                            />
                        }
                    >
                        <Route
                            path="users"
                            element={<UsersPage />}
                        />

                        <Route
                            path="users/create"
                            element={<UsersCreate />}
                        />

                        <Route
                            path="users/:id/edit"
                            element={<UsersUpdate />}
                        />
                    </Route>

                    {/* Locations */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="locations.view"
                            />
                        }
                    >
                        <Route
                            path="locations"
                            element={<LocationsPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="locations.manage"
                            />
                        }
                    >
                        <Route
                            path="locations/create"
                            element={<LocationsCreate />}
                        />

                        <Route
                            path="locations/:id/edit"
                            element={<LocationsUpdate />}
                        />
                    </Route>

                    {/* Location assignments */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="location-assignments.view"
                            />
                        }
                    >
                        <Route
                            path="location-assignments"
                            element={
                                <LocationAssignmentsPage />
                            }
                        />
                    </Route>

                    {/* Categories */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="categories.view"
                            />
                        }
                    >
                        <Route
                            path="categories"
                            element={<CategoriesPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="categories.manage"
                            />
                        }
                    >
                        <Route
                            path="categories/create"
                            element={<CategoriesCreate />}
                        />

                        <Route
                            path="categories/:id/edit"
                            element={<CategoriesUpdate />}
                        />
                    </Route>

                    {/* Brands */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="brands.view"
                            />
                        }
                    >
                        <Route
                            path="brands"
                            element={<BrandsPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="brands.manage"
                            />
                        }
                    >
                        <Route
                            path="brands/create"
                            element={<BrandsCreate />}
                        />

                        <Route
                            path="brands/:id/edit"
                            element={<BrandsUpdate />}
                        />
                    </Route>

                    {/* Products */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="products.view"
                            />
                        }
                    >
                        <Route
                            path="products"
                            element={<ProductsPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="products.manage"
                            />
                        }
                    >
                        <Route
                            path="products/create"
                            element={<ProductsCreate />}
                        />

                        <Route
                            path="products/:id/edit"
                            element={<ProductsUpdate />}
                        />
                    </Route>

                    {/* Payment methods */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="payment-methods.view"
                            />
                        }
                    >
                        <Route
                            path="payment-methods"
                            element={
                                <PaymentMethodsPage />
                            }
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="payment-methods.manage"
                            />
                        }
                    >
                        <Route
                            path="payment-methods/create"
                            element={
                                <PaymentMethodsCreate />
                            }
                        />

                        <Route
                            path="payment-methods/:id/edit"
                            element={
                                <PaymentMethodsUpdate />
                            }
                        />
                    </Route>

                    {/* Tax rates */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="tax-rates.view"
                            />
                        }
                    >
                        <Route
                            path="tax-rates"
                            element={<TaxRatesPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="tax-rates.manage"
                            />
                        }
                    >
                        <Route
                            path="tax-rates/create"
                            element={<TaxRatesCreate />}
                        />

                        <Route
                            path="tax-rates/:id/edit"
                            element={<TaxRatesUpdate />}
                        />
                    </Route>

                    {/* Product prices */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="product-prices.view"
                            />
                        }
                    >
                        <Route
                            path="product-prices"
                            element={
                                <ProductPricesPage />
                            }
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="product-prices.manage"
                            />
                        }
                    >
                        <Route
                            path="product-prices/create"
                            element={
                                <ProductPricesCreate />
                            }
                        />

                        <Route
                            path="product-prices/:id/edit"
                            element={
                                <ProductPricesUpdate />
                            }
                        />
                    </Route>

                    {/* Suppliers */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="suppliers.view"
                            />
                        }
                    >
                        <Route
                            path="suppliers"
                            element={<SuppliersPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="suppliers.manage"
                            />
                        }
                    >
                        <Route
                            path="suppliers/create"
                            element={<SuppliersCreate />}
                        />

                        <Route
                            path="suppliers/:id/edit"
                            element={<SuppliersUpdate />}
                        />
                    </Route>

                    {/* Purchase orders */}
                    <Route
                        element={
                            <PermissionRoute
                                permission="purchase-orders.view"
                            />
                        }
                    >
                        <Route
                            path="purchase-orders"
                            element={
                                <PurchaseOrdersPage />
                            }
                        />

                        <Route
                            path="purchase-orders/:id"
                            element={
                                <PurchaseOrderDetails />
                            }
                        />
                    </Route>

                    <Route
                        element={
                            <PermissionRoute
                                permission="purchase-orders.manage"
                            />
                        }
                    >
                        <Route
                            path="purchase-orders/create"
                            element={
                                <PurchaseOrdersCreate />
                            }
                        />

                        <Route
                            path="purchase-orders/:id/edit"
                            element={
                                <PurchaseOrdersUpdate />
                            }
                        />
                    </Route>

                    {/* Unknown authenticated route */}
                    <Route
                        path="*"
                        element={<NotFoundPage />}
                    />
                </Route>
            </Route>

            {/* Unknown public route */}
            <Route
                path="*"
                element={<NotFoundPage />}
            />
        </Routes>
    );
}

export default App;
