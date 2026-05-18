import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaFileContract, FaFileUpload, FaFileInvoiceDollar, FaTasks, FaTruck, FaPlus, FaSyncAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

import vendorService from "../../services/vendorService";
import analyticsService from "../../services/analyticsService";
const VendorRadar = () => {
  const [radarData, setRadarData] = useState([
    { subject: "On-time Delivery", A: 0 },
    { subject: "Quality", A: 0 },
    { subject: "Compliance", A: 0 },
    { subject: "Response", A: 0 }
  ]);
  useEffect(() => {
    analyticsService.getVendorPerformance().then((data) => {
      const list = Array.isArray(data) ? data : [];
      if (!list.length) return;
      const avg = (key) => Math.round(list.reduce((s, v) => s + (v[key] || 0), 0) / list.length);
      const maxResponseDays = Math.max(...list.map((v) => v.avgResponseTimeDays || 1), 1);
      setRadarData([
        { subject: "On-time Delivery", A: avg("onTimeDeliveryRate") },
        { subject: "Quality", A: Math.round(avg("qualityScore") / 5 * 100) },
        { subject: "Compliance", A: Math.min(100, avg("onTimeDeliveryRate")) },
        { subject: "Response", A: Math.round((1 - avg("avgResponseTimeDays") / (maxResponseDays * 1.2)) * 100) }
      ]);
    }).catch(() => {});
  }, []);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <Radar name="Score" dataKey="A" stroke="#3498db" fill="#3498db" fillOpacity={0.3} />
        <Tooltip formatter={(v) => `${v}%`} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const VendorDashboard = () => {
  const [kpi, setKpi] = useState(null);
  const [trends, setTrends] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await vendorService.syncFromPm().catch((e) => console.warn("Auto-sync skipped", e));

        // Derive KPIs directly from the real data APIs
        const [contractsRes, docsRes, invoicesRes, tasksRes] = await Promise.allSettled([
          vendorService.getContracts(0, 1000),
          vendorService.getDocuments(0, 1000),
          vendorService.getInvoices(0, 1000),
          vendorService.getTasks()
        ]);

        const contracts = contractsRes.status === "fulfilled"
          ? (contractsRes.value?.content || (Array.isArray(contractsRes.value) ? contractsRes.value : []))
          : [];
        const docs = docsRes.status === "fulfilled"
          ? (Array.isArray(docsRes.value) ? docsRes.value : docsRes.value?.content || [])
          : [];
        const invs = invoicesRes.status === "fulfilled"
          ? (invoicesRes.value?.content || (Array.isArray(invoicesRes.value) ? invoicesRes.value : []))
          : [];
        const tasks = tasksRes.status === "fulfilled"
          ? (Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.content || [])
          : [];

        const activeContracts = contracts.filter((c) => c?.status === "ACTIVE" || c?.status === "SIGNED").length || contracts.length;
        const pendingDocuments = docs.filter((d) => d?.status === "PENDING" || d?.status === "SUBMITTED" || d?.status === "DRAFT").length;
        const submittedInvoices = invs.filter((i) => i?.status === "SUBMITTED" || i?.status === "PENDING" || i?.status === "APPROVED").length || invs.length;
        const totalContractValue = contracts.reduce((s, c) => s + (c?.totalValue || c?.contractValue || c?.value || 0), 0);

        setKpi({
          activeContracts,
          pendingDocuments,
          submittedInvoices,
          assignedTasks: tasks.length,
          totalContractValue
        });

        // invs already fetched above — reuse for trend chart
        const monthly = invs.reduce((acc, inv) => {
          const m = new Date(inv.date || inv.dueDate || Date.now()).toLocaleString("default", { month: "short" });
          acc[m] = (acc[m] || 0) + (inv.amount || 0);
          return acc;
        }, {});
        setTrends(Object.entries(monthly).map(([month, amount]) => ({ month, amount })));
        const nRes = await vendorService.getNotifications().catch(() => []);
        const acts = (Array.isArray(nRes) ? nRes : nRes?.content || []).slice(0, 4).map((n) => ({
          icon: n?.type === "INVOICE" ? FaFileInvoiceDollar : FaTruck,
          color: n?.type === "INVOICE" ? "success" : "primary",
          text: n?.message || "Activity update",
          time: n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Just now"
        }));
        setActivities(acts.length ? acts : [
          { icon: FaCheckCircle, color: "success", text: "Welcome to the Vendor Portal!", time: "Just now" }
        ]);
      } catch (err) {
        console.error("Dashboard data load failed", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  if (loading) return <div className="p-5 text-center text-muted">Loading your dashboard...</div>;
  if (error) return <div className="p-5">
      <div className="alert alert-danger rounded-4 d-flex align-items-center gap-3">
        <FaExclamationTriangle size={24} />
        <div>
          <h5 className="fw-bold mb-1">Oops! Something went wrong</h5>
          <p className="mb-0">{error}</p>
        </div>
      </div>
      <AppButton variant="outline-primary" className="rounded-3 mt-3" onClick={() => window.location.reload()}>
        <FaSyncAlt className="me-2" /> Reload Page
      </AppButton>
    </div>;
  const KpiCard = ({ label, value, icon: Icon, color, sub, onClick }) => <Card className="border-0 shadow-sm rounded-4 h-100" style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <Card.Body className="p-4 d-flex align-items-center justify-content-between">
        <div>
          <p className="small text-muted text-uppercase fw-bold mb-1">{label}</p>
          <h2 className={`fw-bold text-${color} mb-0`}>{value ?? "..."}</h2>
          {sub && <div className="small text-muted mt-1">{sub}</div>}
        </div>
        <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>
          <Icon size={24} />
        </div>
      </Card.Body>
    </Card>;
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Vendor Portal</h3>
          <p className="text-muted mb-0">Manage your contracts, documents, invoices, and deliveries.</p>
        </div>
        <div className="d-flex gap-2">
          <AppButton variant="primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/contracts")}>
            <FaPlus /> New Contract
          </AppButton>
        </div>
      </div>

      {
    /* KPIs */
  }
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}><KpiCard label="Active Contracts" value={kpi?.activeContracts} icon={FaFileContract} color="primary" sub={kpi ? `$${(kpi.totalContractValue / 1e3).toFixed(0)}K total value` : ""} onClick={() => navigate("/vendor/contracts")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Documents" value={kpi?.pendingDocuments} icon={FaFileUpload} color="warning" onClick={() => navigate("/vendor/documents")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Submitted Invoices" value={kpi?.submittedInvoices} icon={FaFileInvoiceDollar} color="success" onClick={() => navigate("/vendor/invoices")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Assigned Tasks" value={kpi?.assignedTasks} icon={FaTasks} color="danger" onClick={() => navigate("/vendor/tasks")} /></Col>
      </Row>

      {
    /* Quick Actions */
  }
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold text-muted text-uppercase mb-3">Quick Actions</h6>
          <div className="d-flex flex-wrap gap-3">
            <AppButton variant="outline-primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/contracts")}>
              <FaFileContract /> Create Contract
            </AppButton>
            <AppButton variant="outline-warning" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/documents")}>
              <FaFileUpload /> Upload Document
            </AppButton>
            <AppButton variant="outline-success" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/invoices")}>
              <FaFileInvoiceDollar /> Create Invoice
            </AppButton>
            <AppButton variant="outline-info" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/deliveries")}>
              <FaTruck /> Track Delivery
            </AppButton>
            <AppButton variant="outline-danger" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/vendor/tasks")}>
              <FaTasks /> View Tasks
            </AppButton>
          </div>
        </Card.Body>
      </Card>

      {
    /* Charts Row */
  }
      <Row className="g-4">
        {
    /* Invoice Trend */
  }
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Invoice Amounts Over Time</h6>
              {trends.length > 0 ? <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1e3).toFixed(0)}K`} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="amount" stroke="#3498db" strokeWidth={2} dot={{ r: 4 }} name="Invoice Amount" />
                  </LineChart>
                </ResponsiveContainer> : <div className="bg-light rounded-4 d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                  <span className="text-muted small">No invoice history available</span>
                </div>}
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>;
};
export {
  VendorDashboard
};
