import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/Layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/Common/ErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Các trang nặng (biểu đồ, quản lý tài khoản) chỉ tải khi mở lần đầu để trang chạy nhanh hơn
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const CouponsPage = lazy(() => import('./pages/CouponsPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));

const PageFallback = () => (
  <div className="py-20">
    <LoadingSpinner />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route
          path="reviews"
          element={
            <Suspense fallback={<PageFallback />}>
              <ReviewsPage />
            </Suspense>
          }
        />
        <Route
          path="coupons"
          element={
            <Suspense fallback={<PageFallback />}>
              <CouponsPage />
            </Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <Suspense fallback={<PageFallback />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route
          path="support"
          element={
            <Suspense fallback={<PageFallback />}>
              <SupportPage />
            </Suspense>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute requireRole="admin">
              <Suspense fallback={<PageFallback />}>
                <UsersPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RealtimeProvider>
            <AppRoutes />
          </RealtimeProvider>
          <Toaster
            position="top-right"
            containerStyle={{ top: 76 }} // nằm dưới thanh tiêu đề: không che chuông thông báo / menu tài khoản
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
