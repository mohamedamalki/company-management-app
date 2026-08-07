import {Routes,Route} from 'react-router-dom'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import UsersPage from './pages/users/UsersPage'
import UsersCreate from './pages/users/UsersCreate'
import UsersUpdate from './pages/users/UsersUpdate'
import CategoriesPage from './pages/categories/CategoriesPage'
import CategoriesCreate from './pages/categories/CategoriesCreate'
import CategoriesUpdate from './pages/categories/CategoriesUpdate'
import ProductsPage from './pages/products/ProductsPage'
import ProductsCreate from './pages/products/ProductsCreate'
import ProductsUpdate from './pages/products/ProductsUpdate'
import LocationsPage from './pages/locations/LocationsPage'
import LocationsCreate from './pages/locations/LocationsCreate'
import LocationsUpdate from './pages/locations/LocationsUpdate'
import BrandsPage from './pages/brands/BrandsPage'
import BrandsCreate from './pages/brands/BrandsCreate'
import BrandsUpdate from './pages/brands/BrandsUpdate'
import LocationAssignmentsPage from './pages/locationAssignments/LocationAssignmentsPage'
import PaymentMethodsPage from './pages/paymentMethods/PaymentMethodsPage'
import PaymentMethodsCreate from './pages/paymentMethods/PaymentMethodsCreate'
import PaymentMethodsUpdate from './pages/paymentMethods/PaymentMethodsUpdate'
import TaxRatesPage from './pages/taxRates/TaxRatesPage'
import TaxRatesCreate from './pages/taxRates/TaxRatesCreate'
import TaxRatesUpdate from './pages/taxRates/TaxRatesUpdate'
import ProductPricesPage from './pages/productPrices/ProductPricesPage'
import ProductPricesCreate from './pages/productPrices/ProductPricesCreate'
import ProductPricesUpdate from './pages/productPrices/ProductPricesUpdate'
import SuppliersPage from './pages/suppliers/SuppliersPage'
import SuppliersCreate from './pages/suppliers/SuppliersCreate'
import SuppliersUpdate from './pages/suppliers/SuppliersUpdate'
import PurchaseOrdersPage from './pages/purchaseOrders/PurchaseOrdersPage'
import PurchaseOrdersCreate from './pages/purchaseOrders/PurchaseOrdersCreate'
import PurchaseOrdersUpdate from './pages/purchaseOrders/PurchaseOrdersUpdate'
import PurchaseOrderDetails from './pages/purchaseOrders/PurchaseOrdersDetails'
import Responsable from './pages/responsable/Responsable'
import NotFoundPage from './pages/NotFoundPage'

function App() {


  return (
    <div>
        <Routes>
            <Route element = {<GuestRoute/>}>
            <Route path='/login' element={<Login/>}/>
            </Route>
            <Route element = {<ProtectedRoute allowedRoles={["admin"]} />}  >
            <Route path="/admin" element={<DashboardLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/create" element={<UsersCreate />} />
                <Route path="users/:id/edit" element={<UsersUpdate />} />
                {/* locations routes */}
                <Route path="locations" element={<LocationsPage />} />
                <Route path="locations/create" element={<LocationsCreate />} />
                <Route path="locations/:id/edit" element={<LocationsUpdate />} />
                {/* ctegories routes */}
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="categories/create" element={<CategoriesCreate />}/>
                <Route path="categories/:id/edit" element={<CategoriesUpdate />}/>
                {/* products routes */}
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/create" element={<ProductsCreate />}/>
                <Route path="products/:id/edit" element={<ProductsUpdate />}/>
                {/* brands routes */}
                <Route path="/admin/brands" element={<BrandsPage />}/>
                <Route path="/admin/brands/create" element={<BrandsCreate />}/>
                <Route path="/admin/brands/:id/edit" element={<BrandsUpdate />}/>

                <Route path="location-assignments" element={<LocationAssignmentsPage />}/>

                <Route path="payment-methods" element={<PaymentMethodsPage />}/>
                <Route path="payment-methods/create" element={<PaymentMethodsCreate />}/>
                <Route path="payment-methods/:id/edit" element={<PaymentMethodsUpdate />}/>

                <Route path="tax-rates" element={<TaxRatesPage />} />
                <Route path="tax-rates/create" element={<TaxRatesCreate />} />
                <Route path="tax-rates/:id/edit" element={<TaxRatesUpdate />} />

                <Route path="product-prices" element={<ProductPricesPage />}/>
                <Route path="product-prices/create" element={<ProductPricesCreate />}/>
                <Route path="product-prices/:id/edit" element={<ProductPricesUpdate />}/>

                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="suppliers/create" element={<SuppliersCreate />} />
                <Route path="suppliers/:id/edit" element={<SuppliersUpdate />} />

                <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="purchase-orders/create" element={<PurchaseOrdersCreate />}/>
                <Route path="purchase-orders/:id" element={<PurchaseOrderDetails />}/>
                <Route path="purchase-orders/:id/edit" element={<PurchaseOrdersUpdate />}/>
            </Route>
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["responsable"]}/>}>
            <Route path="/responsable/dashboard" element={<Responsable />}/>
            </Route>
            <Route path="*" element={<NotFoundPage/>}/>
        </Routes>
    </div>
  )
}

export default App
