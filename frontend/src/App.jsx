import {Routes,Route} from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/dashboard/AdminDashboard'

function App() {


  return (
    <div>
        <Routes>
            <Route path='/login' element={<Login/>}/>
            <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
            />
        </Routes>
    </div>
  )
}

export default App
