const Role = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  SITE_ENGINEER: "SITE_ENGINEER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  VENDOR: "VENDOR",
  FINANCE_OFFICER: "FINANCE_OFFICER"
};
const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION"
};
const ROLE_ROUTES = {
  [Role.ADMIN]: ["/", "/admin", "/admin/iam/users", "/admin/iam/audit-logs", "/projects", "/approvals", "/budgets", "/expenses", "/payments", "/sitelogs", "/issues", "/safety", "/resources", "/vendor", "/reports", "/profile", "/templates"],
  [Role.PROJECT_MANAGER]: ["/", "/projects", "/approvals", "/budgets", "/expenses", "/payments", "/sitelogs", "/issues", "/safety", "/resources", "/allocations", "/vendor", "/reports", "/profile", "/tasks", "/templates"],
  [Role.SITE_ENGINEER]: ["/", "/siteops", "/projects", "/profile"],
  [Role.SAFETY_OFFICER]: ["/", "/safety", "/sitelogs", "/projects", "/profile", "/reports"],
  [Role.VENDOR]: ["/", "/vendor", "/profile"],
  [Role.FINANCE_OFFICER]: ["/", "/finance", "/budgets", "/expenses", "/invoices", "/payments", "/reports", "/profile", "/notifications"]
};
const DASHBOARD_ROUTES = {
  [Role.ADMIN]: "/admin/dashboard",
  [Role.PROJECT_MANAGER]: "/pm/dashboard",
  [Role.SITE_ENGINEER]: "/siteops/dashboard",
  [Role.SAFETY_OFFICER]: "/safety/dashboard",
  [Role.VENDOR]: "/vendor/dashboard",
  [Role.FINANCE_OFFICER]: "/finance/dashboard"
};
const NAVIGATION_MENUS = {
  [Role.ADMIN]: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "FaChartPie" },
    { label: "Users", path: "/admin/iam/users", icon: "FaUsers" },
    { label: "Audit Logs", path: "/admin/iam/audit-logs", icon: "FaHistory" },
    { label: "System Reports", path: "/reports/dashboard", icon: "FaFileAlt" }
  ],
  [Role.PROJECT_MANAGER]: [
    { label: "Dashboard", path: "/pm/dashboard", icon: "FaChartPie" },
    { label: "Projects", path: "/projects", icon: "FaBuilding" },
    { label: "Resources", path: "/resources", icon: "FaUsers" },
    { label: "Allocations", path: "/allocations", icon: "FaLink" },
    { label: "Approvals", path: "/approvals", icon: "FaCheckCircle" },
    { label: "Templates", path: "/templates", icon: "FaLayerGroup" },
    { label: "Reports", path: "/reports/dashboard", icon: "FaChartLine" }
  ],
  [Role.SITE_ENGINEER]: [
    { label: "Dashboard", path: "/siteops/dashboard", icon: "FaChartPie" },
    { label: "Site Logs", path: "/siteops/sitelogs", icon: "FaFileSignature" },
    { label: "Tasks", path: "/siteops/tasks", icon: "FaTasks" },
    { label: "Issues", path: "/siteops/issues", icon: "FaExclamationTriangle" },
    { label: "Deliveries", path: "/siteops/deliveries", icon: "FaTruckLoading" }
  ],
  [Role.SAFETY_OFFICER]: [
    { label: "Dashboard", path: "/safety/dashboard", icon: "FaChartPie" },
    { label: "Incidents", path: "/safety/incidents", icon: "FaExclamationTriangle" },
    { label: "Inspections", path: "/safety/inspections", icon: "FaSearchPlus" },
    { label: "My Tasks", path: "/safety/tasks", icon: "FaTasks" }
  ],
  [Role.VENDOR]: [
    { label: "Dashboard", path: "/vendor/dashboard", icon: "FaChartPie" },
    { label: "Contracts", path: "/vendor/contracts", icon: "FaFileContract" },
    { label: "Invoices", path: "/vendor/invoices", icon: "FaFileInvoiceDollar" },
    { label: "Deliveries", path: "/vendor/deliveries", icon: "FaTruck" },
    { label: "My Tasks", path: "/vendor/tasks", icon: "FaTasks" }
  ],
  [Role.FINANCE_OFFICER]: [
    { label: "Dashboard", path: "/finance/dashboard",  icon: "FaChartPie" },
    { label: "Budgets",   path: "/finance/budgets",    icon: "FaWallet" },
    { label: "Invoices",  path: "/finance/invoices",   icon: "FaFileInvoiceDollar" },
    { label: "Payments",  path: "/finance/payments",   icon: "FaCreditCard" },
    { label: "My Tasks",  path: "/finance/tasks",      icon: "FaTasks" }
  ]
};
export {
  Role,
  UserStatus,
  DASHBOARD_ROUTES,
  NAVIGATION_MENUS,
  ROLE_ROUTES
};
