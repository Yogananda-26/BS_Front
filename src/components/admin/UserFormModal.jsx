import { useState, useEffect } from "react";
import { Modal, Form, Alert } from "react-bootstrap";
import { 
  FaUserShield, FaUserTie, FaHardHat, FaShieldAlt, 
  FaWallet, FaTruck, FaCheck, FaCircle, FaPauseCircle, FaBan 
} from "react-icons/fa";
import { AppButton } from "../common/AppButton";
import { userService } from "../../services/userService";

const ROLE_CONFIG = [
 
  { value: "PROJECT_MANAGER", label: "Project Manager", icon: FaUserTie,    bg: "#FFE8DC", color: "#993C1D", desc: "Manage projects & teams" },
  { value: "SITE_ENGINEER",   label: "Site Engineer",   icon: FaHardHat,    bg: "#E1F2FB", color: "#0F5A87", desc: "On-site operations" },
  { value: "SAFETY_OFFICER",  label: "Safety Officer",  icon: FaShieldAlt,  bg: "#FFF4DB", color: "#854F0B", desc: "Inspections & incidents" },
  { value: "FINANCE_OFFICER", label: "Finance Officer", icon: FaWallet,     bg: "#E6F2EA", color: "#1F5A36", desc: "Budgets & payments" },
  { value: "VENDOR",          label: "Vendor",          icon: FaTruck,      bg: "#EEF0F3", color: "#4A5260", desc: "External supplier" }
];

const STATUS_CONFIG = [
  { value: "ACTIVE",    label: "Active",    icon: FaCircle,      bg: "#E6F2EA", color: "#1F5A36", desc: "Can access" },
  { value: "INACTIVE",  label: "Inactive",  icon: FaPauseCircle, bg: "#FFF4DB", color: "#854F0B", desc: "Temporarily off" },
  { value: "SUSPENDED", label: "Suspended", icon: FaBan,         bg: "#FCEBEB", color: "#A32D2D", desc: "Access revoked" }
];

// Reusable Corporate Blue Theme Color (Matching BuildSmart Header Accent)
const THEME_BLUE = "#1B4370"; 

const CustomDropdown = ({ value, options, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value) || options[0];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    const handleClick = (e) => { if (!e.target.closest(`[data-dropdown="${label}"]`)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, label]);

  return (
    <div data-dropdown={label} className="position-relative">
      <div 
        onClick={() => setOpen(!open)} 
        className="d-flex align-items-center justify-content-between rounded-pill px-4 py-2 border-0 bg-light shadow-sm transition-all dropdown-hover" 
        style={{ cursor: "pointer", minHeight: "54px" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: 36, height: 36, backgroundColor: selected.bg, color: selected.color }}>
            <SelectedIcon size={16} />
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>{selected.label}</div>
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>{selected.desc}</div>
          </div>
        </div>
        <span className="small fw-bold" style={{ color: THEME_BLUE }}>{open ? "▲" : "▼"}</span>
      </div>
      
      {open && (
        <div className="position-absolute w-100 mt-2 rounded-4 shadow-lg border-0 bg-white p-2" style={{ zIndex: 1000, maxHeight: "280px", overflowY: "auto" }}>
          {options.map((opt) => (
            <div 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setOpen(false); }} 
              className="d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-pill transition-all option-hover" 
              style={{ 
                cursor: "pointer", 
                backgroundColor: value === opt.value ? `${THEME_BLUE}15` : "transparent" 
              }}
            >
              <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 shadow-sm" style={{ width: 32, height: 32, backgroundColor: opt.bg, color: opt.color }}>
                <opt.icon size={14} />
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold" style={{ fontSize: "0.85rem", color: value === opt.value ? THEME_BLUE : "#333" }}>{opt.label}</div>
                <div className="text-muted" style={{ fontSize: "0.65rem" }}>{opt.desc}</div>
              </div>
              {value === opt.value && <FaCheck size={14} style={{ color: THEME_BLUE }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserFormModal = ({ show, onHide, editUser, onSuccess }) => {
  const isEdit = !!editUser;
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "SITE_ENGINEER", status: "ACTIVE", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editUser) setFormData({ ...editUser, password: "" });
    else setFormData({ name: "", email: "", phone: "", role: "SITE_ENGINEER", status: "ACTIVE", password: "" });
    setError(null);
  }, [editUser, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEdit) await userService.updateUser(editUser.userId, formData);
      else await userService.createUser(formData);
      onSuccess(); onHide();
    } catch (err) { 
      setError(err?.response?.data?.message || "Operation failed."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="app-modal" contentClassName="border-0 shadow-lg rounded-4">
        <Modal.Header closeButton className="border-0 px-5 pt-4 pb-2">
          <Modal.Title className="fw-bold fs-4" style={{ color: THEME_BLUE }}>
            {isEdit ? "Edit User" : "Add New User"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-5 py-3">
            {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{error}</Alert>}
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>FULL NAME</Form.Label>
              <Form.Control 
                required type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="rounded-pill px-4 py-2 bg-light border-0 shadow-sm app-input" 
                style={{ minHeight: "50px" }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>EMAIL ADDRESS</Form.Label>
              <Form.Control 
                required type="email" 
                value={formData.email} 
                disabled={isEdit} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="rounded-pill px-4 py-2 bg-light border-0 shadow-sm app-input" 
                style={{ minHeight: "50px", opacity: isEdit ? 0.7 : 1 }}
              />
              {isEdit && <Form.Text className="text-muted ms-3 small">Email cannot be changed.</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>PHONE (OPTIONAL)</Form.Label>
              <Form.Control 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="rounded-pill px-4 py-2 bg-light border-0 shadow-sm app-input" 
                placeholder="9876556789"
                style={{ minHeight: "50px" }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>ROLE</Form.Label>
              <CustomDropdown 
                value={formData.role} 
                options={ROLE_CONFIG} 
                onChange={(val) => setFormData({...formData, role: val})} 
                label="role" 
              />
            </Form.Group>

            {isEdit && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>ACCOUNT STATUS</Form.Label>
                <CustomDropdown 
                  value={formData.status} 
                  options={STATUS_CONFIG} 
                  onChange={(val) => setFormData({...formData, status: val})} 
                  label="status" 
                />
              </Form.Group>
            )}

            {!isEdit && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small mb-2" style={{ color: THEME_BLUE, letterSpacing: "0.5px" }}>TEMPORARY PASSWORD</Form.Label>
                <Form.Control 
                  required type="password" 
                  minLength={8} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="rounded-pill px-4 py-2 bg-light border-0 shadow-sm app-input" 
                  style={{ minHeight: "50px" }}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-2 px-5 pb-4 d-flex justify-content-end gap-2">
            <AppButton variant="light" onClick={onHide} className="rounded-pill px-4 shadow-sm border" style={{ minHeight: "45px" }}>
              Cancel
            </AppButton>
            <AppButton 
              type="submit" 
              disabled={isLoading} 
              className="rounded-pill px-5 fw-bold shadow border-0 text-white submit-btn"
              style={{ backgroundColor: THEME_BLUE, minHeight: "45px" }}
            >
              {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </AppButton>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Re-tuned UI stylesheet tracking the corporate blue palette */}
      <style>{`
        .app-modal {
          max-width: 600px !important;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .app-input:focus {
          box-shadow: 0 0 0 4px rgba(27, 67, 112, 0.15) !important;
          background-color: #fff !important;
          outline: none;
        }
        .dropdown-hover:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
        }
        .option-hover:hover {
          background-color: rgba(27, 67, 112, 0.05) !important;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: #133254 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27, 67, 112, 0.3) !important;
        }
      `}</style>
    </>
  );
};

export { UserFormModal };