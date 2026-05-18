import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";
import { PendingVerificationPage } from "./pages/public/PendingVerificationPage";
import { UnauthorizedPage } from "./pages/public/UnauthorizedPage";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { AuditLogs } from "./pages/admin/AuditLogs";
import { PMDashboard } from "./pages/dashboard/PMDashboard";
import { ReportsLayout } from "./components/layout/ReportsLayout";
import { DashboardOverview } from "./pages/reports/DashboardOverview";
import { ReportGeneration } from "./pages/reports/ReportGeneration";
import { ProjectAnalytics } from "./pages/reports/ProjectAnalytics";
import { VendorAnalytics } from "./pages/reports/VendorAnalytics";
import { SiteEngineerAnalytics } from "./pages/reports/SiteEngineerAnalytics";
import { SafetyAnalytics } from "./pages/reports/SafetyAnalytics";
import { ResourceAnalytics } from "./pages/reports/ResourceAnalytics";
import { UserAnalytics } from "./pages/reports/UserAnalytics";
import { ProjectsPage } from "./pages/projects/ProjectsPage";
import { ProjectDetailPage } from "./pages/projects/ProjectDetailPage";
import { MyTasksPage } from "./pages/projects/MyTasksPage";
import { TemplatesPage } from "./pages/projects/TemplatesPage";
import { ResourcesPage } from "./pages/projects/ResourcesPage";
import { AllocationsPage } from "./pages/projects/AllocationsPage";
import { ApprovalsPage } from "./pages/approvals/ApprovalsPage";
import { SafetyDashboard } from "./pages/safety/SafetyDashboard";
import { IncidentsPage } from "./pages/safety/IncidentsPage";
import { InspectionsPage } from "./pages/safety/InspectionsPage";
import { SafetyTasksPage } from "./pages/safety/SafetyTasksPage";
import { VendorDashboard } from "./pages/vendors/VendorDashboard";
import { ContractsPage } from "./pages/vendors/ContractsPage";
import { DocumentsPage } from "./pages/vendors/DocumentsPage";
import { InvoicesPage } from "./pages/vendors/InvoicesPage";
import { DeliveriesPage } from "./pages/vendors/DeliveriesPage";
import { VendorTasksPage } from "./pages/vendors/VendorTasksPage";
import { SiteOpsDashboard } from "./pages/siteops/SiteOpsDashboard";
import { SiteLogsPage } from "./pages/siteops/SiteLogsPage";
import { IssuesPage } from "./pages/siteops/IssuesPage";
import { SiteTasksPage } from "./pages/siteops/SiteTasksPage";
import { DeliveriesPage as SiteDeliveriesPage } from "./pages/siteops/DeliveriesPage";
import { FinanceDashboard } from "./pages/finance/FinanceDashboard";
import { BudgetsPage } from "./pages/finance/BudgetsPage";
import { InvoicesPage as FinanceInvoicesPage } from "./pages/finance/InvoicesPage";
import { PaymentsPage } from "./pages/finance/PaymentsPage";
import { FinanceTasksPage } from "./pages/finance/FinanceTasksPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import {PublicLayout} from "./components/layout/PublicLayout";
function App() {
  return <Routes>
      {
    /* Public Routes */
  }
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pending-verification" element={<PendingVerificationPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {
    /* All authenticated routes share Layout */
  }
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          {
    /* ── Admin & IAM ── */
  }
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          <Route path="/admin/iam">
            <Route path="users" element={<UserManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {
    /* ── Reports & Analytics (ADMIN + PM) ── */
  }
          <Route path="/reports" element={<ReportsLayout />}>
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="generate" element={<ReportGeneration />} />
            <Route path="projects" element={<ProjectAnalytics />} />
            <Route path="vendors" element={<VendorAnalytics />} />
            <Route path="site-engineers" element={<SiteEngineerAnalytics />} />
            <Route path="safety" element={<SafetyAnalytics />} />
            <Route path="resources" element={<ResourceAnalytics />} />
            <Route path="users" element={<UserAnalytics />} />
          </Route>

          {
    /* ── Project Manager Module ── */
  }
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tasks/my" element={<MyTasksPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/allocations" element={<AllocationsPage />} />

          {
    /* ── Role Dashboards ── */
  }
          <Route path="/pm/dashboard" element={<PMDashboard />} />

          {
    /* ── Safety Officer Module ── */
  }
          <Route path="/safety/dashboard" element={<SafetyDashboard />} />
          <Route path="/safety/incidents" element={<IncidentsPage />} />
          <Route path="/safety/inspections" element={<InspectionsPage />} />
          <Route path="/safety/tasks" element={<SafetyTasksPage />} />

          {
    /* ── Vendor Module ── */
  }
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/contracts" element={<ContractsPage />} />
          <Route path="/vendor/documents" element={<DocumentsPage />} />
          <Route path="/vendor/invoices" element={<InvoicesPage />} />
          <Route path="/vendor/deliveries" element={<DeliveriesPage />} />
          <Route path="/vendor/tasks" element={<VendorTasksPage />} />

          {
    /* ── Site Operations Module ── */
  }
          <Route path="/siteops/dashboard" element={<SiteOpsDashboard />} />
          <Route path="/siteops/sitelogs" element={<SiteLogsPage />} />
          <Route path="/siteops/issues" element={<IssuesPage />} />
          <Route path="/siteops/tasks" element={<SiteTasksPage />} />
          <Route path="/siteops/deliveries" element={<SiteDeliveriesPage />} />

          {
    /* ── Finance Module ── */
  }
          <Route path="/finance/dashboard" element={<FinanceDashboard />} />
          <Route path="/finance/budgets" element={<BudgetsPage />} />
          <Route path="/finance/invoices" element={<FinanceInvoicesPage />} />
          <Route path="/finance/payments" element={<PaymentsPage />} />
          <Route path="/finance/tasks" element={<FinanceTasksPage />} />

          {
    /* ── Notification Module ── */
  }
          <Route path="/notifications" element={<NotificationsPage />} />

        </Route>
      </Route>
    </Routes>;
}
export default App;
