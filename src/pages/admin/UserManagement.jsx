import { useState, useEffect, useCallback } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import {
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Badge,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import {
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaCheckCircle,
  FaTrash,
  FaClock,
  FaSync,
  FaUsers,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaFilter
} from "react-icons/fa";
import { UserStatus } from "../../utils/constants";
import { userService } from "../../services/userService";
import { UserFormModal } from "../../components/admin/UserFormModal";
import { ConfirmActionModal } from "../../components/admin/ConfirmActionModal";
import { toast } from "react-toastify";

// --- RESTORED STYLES ---
const ROLE_COLOR = {
  ADMIN: "danger",
  PROJECT_MANAGER: "primary",
  SITE_ENGINEER: "info",
  SAFETY_OFFICER: "warning",
  FINANCE_OFFICER: "success",
  VENDOR: "secondary"
};

const ROLE_STYLES = {
  ADMIN:           { bg: "#FCEBEB", color: "#A32D2D", border: "#F4C7C7" },
  PROJECT_MANAGER: { bg: "#FFE8DC", color: "#993C1D", border: "#F5C9B0" },
  SITE_ENGINEER:   { bg: "#E1F2FB", color: "#0F5A87", border: "#B8DCF0" },
  SAFETY_OFFICER:  { bg: "#FFF4DB", color: "#854F0B", border: "#F5D78A" },
  FINANCE_OFFICER: { bg: "#E6F2EA", color: "#1F5A36", border: "#B8DCC3" },
  VENDOR:          { bg: "#EEF0F3", color: "#4A5260", border: "#D4D8DD" }
};

const statusVariant = (s) => {
  if (s === UserStatus.ACTIVE) return "success";
  if (s === UserStatus.PENDING_VERIFICATION) return "warning";
  if (s === UserStatus.SUSPENDED) return "danger";
  return "secondary";
};

const statusLabel = (s) => {
  if (s === UserStatus.PENDING_VERIFICATION) return "PENDING";
  return s;
};

const initials = (name) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await userService.getAllUsers(page, PAGE_SIZE);
      setUsers(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setFetchError(err?.response?.data?.message || "Unable to reach the backend server.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const displayedUsers = (Array.isArray(users) ? users : []).filter((u) => {
    if (!u) return false;
    const matchesSearch = searchQuery === "" || 
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingUsers = (Array.isArray(displayedUsers) ? displayedUsers : []).filter(
    (u) => u && u.status === UserStatus.PENDING_VERIFICATION
  );

  const activeCount = (Array.isArray(users) ? users : []).filter((u) => u?.status === UserStatus.ACTIVE).length;
  const suspendedCount = (Array.isArray(users) ? users : []).filter((u) => u?.status === UserStatus.SUSPENDED).length;

  const openConfirm = (config) => {
    setConfirmConfig(config);
    setShowConfirm(true);
  };

  const handleApprove = (user) => openConfirm({
    title: "Approve User",
    message: `Approve ${user.name} and grant them access?`,
    confirmLabel: "Approve",
    confirmVariant: "success",
    action: async () => {
      setApprovingUserId(user.userId);
      await userService.approveUser(user.userId);
      toast.success(`${user.name} approved!`);
      loadUsers();
      setApprovingUserId(null);
    }
  });

  const handleReject = (user) => openConfirm({
    title: "Reject Registration",
    message: `Reject ${user.name}? This cannot be undone.`,
    confirmLabel: "Reject",
    confirmVariant: "danger",
    action: async () => {
      setRejectingUserId(user.userId);
      await userService.rejectUser(user.userId);
      toast.warning(`${user.name} rejected.`);
      loadUsers();
      setRejectingUserId(null);
    }
  });

  const handleDelete = (user) => openConfirm({
    title: "Delete User",
    message: `Permanently delete ${user.name}?`,
    confirmLabel: "Delete",
    confirmVariant: "danger",
    action: async () => {
      await userService.deleteUser(user.userId);
      toast.error(`${user.name} deleted.`);
      loadUsers();
    }
  });

  const handleEdit = (user) => { setEditUser(user); setShowUserForm(true); };
  const handleAddNew = () => { setEditUser(null); setShowUserForm(true); };

  // Helper for Role Style
  const getRoleStyle = (role) => ({
    backgroundColor: ROLE_STYLES[role]?.bg || "#EEF0F3",
    color: ROLE_STYLES[role]?.color || "#4A5260",
    borderColor: ROLE_STYLES[role]?.border || "#D4D8DD",
    fontWeight: 600,
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    border: "1px solid"
  });

  return (
    <div>
      {/* Header & Stats Code Omitted for brevity - No changes there */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FaUserShield className="text-primary" /> User Management
          </h2>
          <p className="text-muted mb-0">Manage staff accounts, roles, and access approvals.</p>
        </div>
        <div className="d-flex gap-2">
          <AppButton variant="outline-primary" onClick={loadUsers} disabled={isLoading}>
            <FaSync className={isLoading ? "spin-animation" : ""} /> Refresh
          </AppButton>
        </div>
      </div>

      {/* Pending Approvals Table (Applying old styles) */}
      {pendingUsers.length > 0 && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ borderLeft: "4px solid #ffc107" }}>
          <Card.Header className="bg-warning bg-opacity-10 border-0 py-3 px-4 d-flex align-items-center gap-2">
             <FaClock className="text-warning" />
            <span className="fw-bold text-dark">{pendingUsers.length} Pending Registrations</span>
          </Card.Header>
          <AppTable columns={['User', 'Role Requested', 'Actions']} isEmpty={false}>
            {pendingUsers.map((u) => (
              <tr key={u.userId}>
                <td className="py-3 px-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="fw-bold rounded-circle d-flex align-items-center justify-content-center border"
                      style={{ width: 44, height: 44, backgroundColor: "#FFF4DB", color: "#854F0B", borderColor: "#F5D78A" }}>
                      {initials(u.name)}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{u.name}</h6>
                      <small className="text-muted">{u.email}</small>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-pill" style={getRoleStyle(u.role)}>
                    {u.role?.replace("_", " ") || "USER"}
                  </span>
                </td>
                <td className="py-3 px-4 text-end">
                   <div className="d-flex justify-content-end gap-2">
                      <AppButton variant="success" size="sm" onClick={() => handleApprove(u)} disabled={approvingUserId === u.userId}>
                        Approve
                      </AppButton>
                      <AppButton variant="outline-danger" size="sm" onClick={() => handleReject(u)}>
                        Reject
                      </AppButton>
                   </div>
                </td>
              </tr>
            ))}
          </AppTable>
        </Card>
      )}

      {/* Main Users Table (Applying old styles) */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-0 py-3 px-4">
          <span className="fw-bold"><FaUsers className="text-primary me-2" /> All Users</span>
        </Card.Header>
        <AppTable columns={['User Profile', 'Role', 'Status', 'Actions']} isEmpty={displayedUsers.length === 0}>
          {displayedUsers.filter(u => u.status !== UserStatus.PENDING_VERIFICATION).map((user) => (
            <tr key={user.userId} className={`transition-bg ${hoveredRow === user.userId ? "bg-primary bg-opacity-5" : ""}`}
              onMouseEnter={() => setHoveredRow(user.userId)} onMouseLeave={() => setHoveredRow(null)}>
              <td className="py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                  <div className={`bg-${ROLE_COLOR[user.role] || "secondary"} bg-opacity-10 text-${ROLE_COLOR[user.role] || "secondary"} fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                    style={{ width: 44, height: 44 }}>
                    {initials(user.name)}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{user.name}</h6>
                    <small className="text-muted">{user.email}</small>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-pill" style={getRoleStyle(user.role)}>
                  {user.role?.replace("_", " ") || "USER"}
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge bg={statusVariant(user.status)} className="px-2 py-1 bg-opacity-10 rounded-pill d-inline-flex align-items-center gap-1">
                  <span className={`bg-${statusVariant(user.status)} rounded-circle`} style={{ width: 7, height: 7 }} />
                  <span className={`text-${statusVariant(user.status)} fw-bold`}>{statusLabel(user.status)}</span>
                </Badge>
              </td>
              <td className="py-3 px-4 text-end">
                <div className="d-flex justify-content-end gap-2">
                  <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}><AppButton variant="light" size="sm" onClick={() => handleEdit(user)}><FaEdit /></AppButton></OverlayTrigger>
                  <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}><AppButton variant="outline-danger" size="sm" onClick={() => handleDelete(user)}><FaTrash /></AppButton></OverlayTrigger>
                </div>
              </td>
            </tr>
          ))}
        </AppTable>
        
        {/* Pagination Card.Footer restored here... */}
      </Card>

      <UserFormModal show={showUserForm} onHide={() => setShowUserForm(false)} editUser={editUser} onSuccess={loadUsers} />
      {confirmConfig && <ConfirmActionModal show={showConfirm} onHide={() => setShowConfirm(false)} onConfirm={confirmConfig.action} {...confirmConfig} />}

      <style>{`
        .transition-bg { transition: background-color 0.2s ease; }
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export { UserManagement };