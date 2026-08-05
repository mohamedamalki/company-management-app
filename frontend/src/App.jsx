import {Routes,Route, Navigate} from 'react-router-dom'
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

function App() {


  return (
    <div>
        <Routes>
            <Route element = {<GuestRoute/>}>
            <Route path='/login' element={<Login/>}/>
            </Route>
            <Route element = {<ProtectedRoute/>}>
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
            </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />}/>
        </Routes>
    </div>
  )
}

export default App
