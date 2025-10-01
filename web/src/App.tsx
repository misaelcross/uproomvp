import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CompanyProvider } from './contexts/CompanyContext'
import { Toaster } from './components/ui/toaster'
import ProtectedRoute from './components/ProtectedRoute'
import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AcceptInvitation from './pages/AcceptInvitation'
import Dashboard from './pages/Dashboard'
import CreateCompany from './pages/CreateCompany'
import JoinCompanyByLink from './pages/JoinCompanyByLink'
import WorkspaceRouter from './components/WorkspaceRouter'
import DashboardRouter from './components/DashboardRouter'
import MainDashboardRouter from './components/MainDashboardRouter'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CompanyProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<WorkspaceRouter><Index /></WorkspaceRouter>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/maindashboard" element={<MainDashboardRouter />} />
              <Route path="/create-company" element={<ProtectedRoute><CreateCompany /></ProtectedRoute>} />
              <Route path="/join-company-by-link" element={<ProtectedRoute><JoinCompanyByLink /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              <Route path="*" element={<WorkspaceRouter><div /></WorkspaceRouter>} />
            </Routes>
          </div>
          <Toaster />
        </CompanyProvider>
      </AuthProvider>
    </Router>
  )
}

export default App;
