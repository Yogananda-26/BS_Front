import { useState, useEffect } from "react";
import { AppButton } from "../common/AppButton";
import { NavDropdown, Badge, ListGroup } from "react-bootstrap";
import { FaBell, FaCircle, FaTasks, FaCheckCircle, FaFileInvoice, FaShieldAlt, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";

const timeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return "Just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
};

const getIcon = (type, priority) => {
  if (priority === "CRITICAL") return <FaExclamationCircle className="text-danger" />;
  const safeType = type || "";
  if (safeType.startsWith("TASK")) return <FaTasks className="text-primary" />;
  if (safeType.startsWith("APPROVAL")) return <FaCheckCircle className="text-warning" />;
  if (safeType.startsWith("INVOICE")) return <FaFileInvoice className="text-success" />;
  if (safeType.startsWith("SAFETY")) return <FaShieldAlt className="text-danger" />;
  return <FaBell className="text-muted" />;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const load = async () => {
    // Pass full user object — service matches toUserId against userId/name/email
    const list = await notificationService.getNotifications(user, 0, 50);
    setNotifications(list);
    const unread = list.filter((n) => !n.read);
    setUnreadCount(unread.length);
    setCriticalCount(unread.filter((n) => n.priority === "CRITICAL").length);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [user?.userId]);

  const handleRead = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const unread = updated.filter((n) => !n.read);
      setUnreadCount(unread.length);
      setCriticalCount(unread.filter((n) => n.priority === "CRITICAL").length);
      return updated;
    });
    notificationService.markAsRead(id).catch(() => {});
  };

  const getBadgeColor = () => {
    if (criticalCount > 0) return "danger";
    if (unreadCount > 10) return "danger";
    if (unreadCount > 5) return "warning";
    return "primary";
  };

  return <NavDropdown
    title={<div className="position-relative d-inline-block">
          <FaBell size={20} className={unreadCount > 0 ? "text-primary" : "text-muted"} />
          {unreadCount > 0 && <Badge
      pill
      bg={getBadgeColor()}
      className="position-absolute translate-middle-y start-100 top-0 border border-white"
      style={{ fontSize: "0.6rem", padding: "0.25em 0.5em", left: "12px" }}
    >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>}
        </div>}
    id="notification-dropdown"
    align="end"
    className="no-caret mx-2"
  >
      <div style={{ width: "320px", maxHeight: "480px", overflowY: "auto" }} className="py-2">
        <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Notifications</h6>
          {unreadCount > 0 && <AppButton variant="link" size="sm" className="p-0 text-decoration-none small" onClick={() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setCriticalCount(0);
    notificationService.markAllAsRead().catch(() => {});
  }}>
              Mark all read
            </AppButton>}
        </div>

        <ListGroup variant="flush">
          {notifications.length === 0
            ? <div className="p-4 text-center text-muted small">No notifications</div>
            : notifications.map((n) => <ListGroup.Item
                key={n.id}
                action
                className={`px-3 py-3 border-0 ${!n.read ? "bg-light" : ""}`}
                onClick={() => navigate("/notifications")}
              >
                <div className="d-flex gap-3 align-items-start">
                  <div className="mt-1">{getIcon(n.eventType, n.priority)}</div>
                  <div className="flex-grow-1 overflow-hidden">
                    <div className={`small mb-1 ${!n.read ? "fw-bold text-dark" : "text-muted"}`} style={{ lineHeight: "1.2" }}>
                      {n.message}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: "0.7rem" }}>
                      <span className="text-muted">{(n.fromRole || "SYSTEM").replace("_", " ")}</span>
                      <span className="text-muted">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  {!n.read && <div className="mt-1" onClick={(e) => handleRead(n.id, e)}>
                      <FaCircle className="text-primary" size={8} />
                    </div>}
                </div>
              </ListGroup.Item>)
          }
        </ListGroup>

        <div className="px-3 pt-2 mt-2 border-top text-center">
          <AppButton variant="link" size="sm" className="text-decoration-none small fw-bold w-100" onClick={() => navigate("/notifications")}>
            View All Notifications
          </AppButton>
        </div>
      </div>
    </NavDropdown>;
};

export {
  NotificationBell
};
