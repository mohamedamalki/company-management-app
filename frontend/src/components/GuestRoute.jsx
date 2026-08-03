import { Navigate, Outlet } from "react-router-dom"


function GuestRoute() {
    const token = sessionStorage.getItem('token')
    if(token) {
        return <Navigate to={"/admin/dashboard"} replace />
    }
  return <Outlet/>
}

export default GuestRoute
