// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider } from "hooks/useAuth";
import { ProtectedRoute } from "components/auth/ProtectedRoute";
import { AdminRoute } from "components/auth/AdminRoute";
import { AppShell } from "components/layout/AppShell";
import { AdminShell } from "components/layout/AdminShell";
import { LoginPage } from "pages/LoginPage";
import { DashboardPage } from "pages/DashboardPage";
import { NewQuotePage } from "pages/NewQuotePage";
import { QuotesPage } from "pages/QuotesPage";
import { QuoteDetailPage } from "pages/QuoteDetailPage";
import { SettingsPage } from "pages/SettingsPage";
import { AdminOverviewPage } from "pages/admin/AdminOverviewPage";
import { AdminQuotesPage } from "pages/admin/AdminQuotesPage";
import { AdminQuoteDetailPage } from "pages/admin/AdminQuoteDetailPage";
import { AdminPartnersPage } from "pages/admin/AdminPartnersPage";
import { AdminAddPartnerPage } from "pages/admin/AdminAddPartnerPage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Partner portal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index                element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="quote/new"     element={<NewQuotePage />} />
            <Route path="quotes"        element={<QuotesPage />} />
            <Route path="quotes/:id"    element={<QuoteDetailPage />} />
            <Route path="settings"      element={<SettingsPage />} />
          </Route>

          {/* NSD Admin portal */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminShell />
              </AdminRoute>
            }
          >
            <Route index                        element={<AdminOverviewPage />} />
            <Route path="quotes"                element={<AdminQuotesPage />} />
            <Route path="quotes/:id"            element={<AdminQuoteDetailPage />} />
            <Route path="partners"              element={<AdminPartnersPage />} />
            <Route path="partners/new"          element={<AdminAddPartnerPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
