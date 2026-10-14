import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import EmployeePage from './pages/Employee'
import EmployeeProfile from './pages/EmployeeProfile'
import Login from './pages/Login'
import Masters from './pages/Masters'
import NotFound from './pages/NotFound'
import EmployeePayslips from './pages/Payroll'
import PayslipDetail from './pages/PayslipDetail'
import Projects from './pages/Projects'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/login" replace />} />
      <Route path="login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="employee" element={<EmployeePage />} />
        <Route path="employee/:code" element={<EmployeeProfile />} />
        <Route path="payroll" element={<EmployeePayslips />} />
        <Route path="payroll/:code/:period" element={<PayslipDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="masters" element={<Masters />} />
        <Route path="home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
