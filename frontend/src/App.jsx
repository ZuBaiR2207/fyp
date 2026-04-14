import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/AuthContext'
import LoginPage from './pages/LoginPage.jsx'
import StudentPortalPage from './pages/StudentPortalPage.jsx'
import UniversityPortalPage from './pages/UniversityPortalPage.jsx'

function AppRoutes() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (role === 'STUDENT') {
    return (
      <Routes>
        <Route path="/student" element={<StudentPortalPage />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/university" element={<UniversityPortalPage />} />
      <Route path="*" element={<Navigate to="/university" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

