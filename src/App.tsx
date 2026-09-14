import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store.js';
import { useSocket } from './hooks/useSocket.js';

// Layout
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { BottomNav } from './components/layout/BottomNav.js';
import { ProtectedRoute, RoleRoute } from './components/auth/ProtectedRoute.js';

// Public / Player Pages
import { HomePage } from './pages/HomePage.js';
import { VenuesPage } from './pages/VenuesPage.js';
import { VenueDetailPage } from './pages/VenueDetailPage.js';
import { BookingCreatePage } from './pages/BookingCreatePage.js';
import { MyBookingsPage } from './pages/MyBookingsPage.js';
import { MatchesPage } from './pages/MatchesPage.js';
import { MatchDetailPage } from './pages/MatchDetailPage.js';
import { ChatPage } from './pages/ChatPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

// Owner Portal Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage.js';
import { OwnerVenuesPage } from './pages/owner/OwnerVenuesPage.js';
import { OwnerFieldsPage } from './pages/owner/OwnerFieldsPage.js';
import { OwnerBookingsPage } from './pages/owner/OwnerBookingsPage.js';
import { OwnerReviewsPage } from './pages/owner/OwnerReviewsPage.js';

// Admin Portal Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminVenuesPage } from './pages/admin/AdminVenuesPage.js';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage.js';

// Layout wrapper to control Navbar & Footer visibility
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isPortal = location.pathname.startsWith('/owner') || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-16 lg:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!isPortal && <Footer />}
      {!isPortal && <BottomNav />}
    </div>
  );
};

// Global App Root
export default function App() {
  const { fetchCurrentUser } = useAuthStore();
  useSocket(); // Hook up real-time notifications & chat listeners

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public & Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated User Routes */}
          <Route
            path="/booking/create"
            element={
              <ProtectedRoute>
                <BookingCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Owner Portal Routes */}
          <Route
            path="/owner/dashboard"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/venues"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerVenuesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/fields"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerFieldsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/bookings"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerBookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/reviews"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerReviewsPage />
              </RoleRoute>
            }
          />

          {/* Admin Portal Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/venues"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminVenuesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminBookingsPage />
              </RoleRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
