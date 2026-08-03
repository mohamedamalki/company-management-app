import {Routes,Route, Navigate} from 'react-router-dom'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import UsersPage from './pages/users/UsersPage'
import DepotsPage from './pages/depots/DepotsPage'
import UsersCreate from './pages/users/UsersCreate'
import UsersUpdate from './pages/users/UsersUpdate'
import DepotsCreate from './pages/depots/DepotsCreate'
import DepotsUpdate from './pages/depots/DepotsUpdate'
import CategoriesPage from './pages/categories/CategoriesPage'
import CategoriesCreate from './pages/categories/CategoriesCreate'
import CategoriesUpdate from './pages/categories/CategoriesUpdate'
import ProductsPage from './pages/products/ProductsPage'
import ProductsCreate from './pages/products/ProductsCreate'
import ProductsUpdate from './pages/products/ProductsUpdate'

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

                <Route path="depots" element={<DepotsPage />} />
                <Route path="depots/create" element={<DepotsCreate />} />
                <Route path="depots/:id/edit" element={<DepotsUpdate />} />

                <Route path="categories" element={<CategoriesPage />} />
                <Route path="categories/create" element={<CategoriesCreate />}/>
                <Route path="categories/:id/edit" element={<CategoriesUpdate />}/>

                <Route path="products" element={<ProductsPage />} />
                <Route path="products/create" element={<ProductsCreate />}/>
                <Route path="products/:id/edit" element={<ProductsUpdate />}/>
            </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />}/>
        </Routes>
    </div>
  )
}

export default App
