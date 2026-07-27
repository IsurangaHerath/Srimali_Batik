import { Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'
import AuthGuard from './components/admin/AuthGuard'
import HomePage from './pages/public/HomePage'
import PatternsPage from './pages/public/PatternsPage'
import PatternDetailPage from './pages/public/PatternDetailPage'
import NotFoundPage from './pages/public/NotFoundPage'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminPatternsPage from './pages/admin/patterns/AdminPatternsPage'
import AdminProductsPage from './pages/admin/products/AdminProductsPage'
import AdminColorsPage from './pages/admin/colors/AdminColorsPage'
import AdminSettingsPage from './pages/admin/settings/AdminSettingsPage'
import AdminActivityPage from './pages/admin/activity/AdminActivityPage'

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/patterns/:slug" element={<PatternDetailPage />} />
        </Route>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patterns" element={<AdminPatternsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="colors" element={<AdminColorsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="activity" element={<AdminActivityPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App