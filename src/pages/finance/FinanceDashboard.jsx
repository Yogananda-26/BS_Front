import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { AppButton } from "../../components/common/AppButton";
import { FaWallet, FaCreditCard, FaTasks, FaChartPie } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { financeService } from "../../services/financeService";

// ── helpers ───────────────────────────────────────────────────────────────────

function buildCategoryChart(budgets) {
  if (!budgets.length) return [];
  const map = {};
  budgets.forEach((b) => {
    const key = b.budgetCategory || "General";
    map[key] = map[key] || { name: key, planned: 0, actual: 0 };
    map[key].planned += Number(b.plannedAmount || 0);
    map[key].actual  += Number(b.actualAmount  || 0);
  });
  return Object.values(map).slice(0, 6);
}

function buildPieData(initiated, completed, rejected) {
  const data = [];
  if (initiated > 0) data.push({ name: "Initiated", value: initiated, color: "#3498db" });
  if (completed > 0) data.push({ name: "Completed", value: completed, color: "#27ae60" });
  if (rejected  > 0) data.push({ name: "Rejected",  value: rejected,  color: "#e74c3c" });
  return data.length ? data : [{ name: "No payments", value: 1, color: "#e9ecef" }];
}

const fmt  = (n) => `$${Number(n).toLocaleString()}`;
const fmtK = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;

// ── main ──────────────────────────────────────────────────────────────────────

const FinanceDashboard = () => {
  const [loading, setLoading]         = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalPaid, setTotalPaid]     = useState(0);
  const [utilization, setUtil]        = useState(0);
  const [pendingCount, setPending]    = useState(0);
  const [barData, setBarData]         = useState([]);
  const [pieData, setPieData]         = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await financeService.syncBudgetApprovals().catch(() => {});
        const [approved, completed, pending, initiated, rejected] = await Promise.all([
          financeService.getBudgetsByStatus("APPROVED").catch(() => []),
          financeService.getPaymentsByStatus("COMPLETED").catch(() => []),
          financeService.getPendingPayments().catch(() => []),
          financeService.getPaymentsByStatus("INITIATED").catch(() => []),
          financeService.getPaymentsByStatus("REJECTED").catch(() => []),
        ]);
        const bt = approved.reduce((s, b) => s + Number(b.plannedAmount || 0), 0);
        const pt = completed.reduce((s, p) => s + Number(p.amount || 0), 0);
        const pc = Array.isArray(pending) ? pending.length : pending?.content?.length || 0;
        setTotalBudget(bt);
        setTotalPaid(pt);
        setUtil(bt > 0 ? (pt / bt) * 100 : 0);
        setPending(pc);
        setBarData(buildCategoryChart(approved));
        setPieData(buildPieData(initiated.length, completed.length, rejected.length));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const utilVariant = utilization > 90 ? "danger" : utilization > 70 ? "warning" : "success";

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <Spinner animation="border" variant="dark" />
        <p className="text-muted mt-2 small">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4">

      {/* ── Header — matches Budget Management exactly ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Finance Dashboard</h3>
          <p className="text-muted mb-0">Live summary of budgets and payments.</p>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-2 d-flex align-items-center justify-content-between">
              <div>
                <p className="small text-muted text-uppercase fw-bold mb-1">Approved Budget</p>
                <h4 className="fw-bold text-dark mb-0">{fmt(totalBudget)}</h4>
                <div className="small text-muted mt-1">Across all approved budgets</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                <FaWallet size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <p className="small text-muted text-uppercase fw-bold mb-1">Total Paid</p>
                <h4 className="fw-bold text-success mb-0">{fmt(totalPaid)}</h4>
                <div className="small text-muted mt-1">Completed payments</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                <FaCreditCard size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div className="w-100 me-3">
                <p className="small text-muted text-uppercase fw-bold mb-1">Budget Utilization</p>
                <h4 className="fw-bold text-dark mb-1">{utilization.toFixed(1)}%</h4>
                <ProgressBar
                  now={Math.min(utilization, 100)}
                  variant={utilVariant}
                  style={{ height: "6px" }}
                  className="rounded-pill"
                />
              </div>
              <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle flex-shrink-0">
                <FaChartPie size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/finance/payments")}
          >
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <p className="small text-muted text-uppercase fw-bold mb-1">Pending Payments</p>
                <h4 className={`fw-bold mb-0 ${pendingCount > 0 ? "text-danger" : "text-dark"}`}>
                  {pendingCount}
                </h4>
                <div className="small text-muted mt-1">
                  {pendingCount > 0 ? "Needs attention →" : "All cleared"}
                </div>
              </div>
              <div className={`${pendingCount > 0 ? "bg-danger" : "bg-info"} bg-opacity-10 ${pendingCount > 0 ? "text-danger" : "text-info"} p-3 rounded-circle`}>
                <FaTasks size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Quick Actions — matches Budget Management button style ── */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold text-muted text-uppercase mb-3">Quick Actions</h6>
          <div className="d-flex flex-wrap gap-3">
            <AppButton
              variant="outline-primary"
              className="rounded-3 d-flex align-items-center gap-2"
              onClick={() => navigate("/finance/budgets")}
            >
              <FaWallet /> Manage Budgets
            </AppButton>
            <AppButton
              variant="outline-success"
              className="rounded-3 d-flex align-items-center gap-2"
              onClick={() => navigate("/finance/payments")}
            >
              <FaCreditCard /> Process Payment
            </AppButton>
            <AppButton
              variant="outline-info"
              className="rounded-3 d-flex align-items-center gap-2"
              onClick={() => navigate("/finance/tasks")}
            >
              <FaTasks /> Finance Tasks
            </AppButton>
          </div>
        </Card.Body>
      </Card>

      {/* ── Charts ── */}
      <Row className="g-4">

        {/* Bar Chart */}
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-1">Budget vs Actual by Category</h6>
              <p className="text-muted small mb-4">Planned allocation vs actual spending across approved budgets</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} barSize={16} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                    <Tooltip
                      formatter={(v) => fmt(v)}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e9ecef", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="planned" name="Planned" fill="#2c3e50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual"  name="Actual"  fill="#3498db" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center bg-light rounded-3" style={{ height: 240 }}>
                  <p className="text-muted small mb-0">No approved budgets yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pie Chart */}
        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-1">Payment Status</h6>
              <p className="text-muted small mb-3">Breakdown of all payments by status</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e9ecef", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="d-flex flex-column gap-2 mt-2">
                {pieData[0]?.name !== "No payments" ? pieData.map((e, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                      <span className="small text-muted">{e.name}</span>
                    </div>
                    <Badge bg="light" text="dark" className="border small fw-semibold">{e.value}</Badge>
                  </div>
                )) : (
                  <p className="text-muted small text-center mb-0">No payments yet.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export { FinanceDashboard };
