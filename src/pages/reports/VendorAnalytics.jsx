import { useState, useEffect } from "react";
import { Row, Col, Card, Form, ProgressBar, Badge } from "react-bootstrap";
import { FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaFilter } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import mockService from "../../services/analyticsService";
import projectService from "../../services/projectService";
import { ChartCard } from "../../components/common/ChartCard";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../utils/constants";

const VendorAnalytics = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    projectService.getProjects().then((p) => setProjects(Array.isArray(p) ? p : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const compRes = await mockService.getVendorCompliance().catch(() => null);
        if (compRes) setCompliance(compRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const donutData = compliance ? [
    { name: "Compliant", value: compliance.compliantVendors, color: "var(--bs-success)" },
    { name: "Non-Compliant", value: compliance.nonCompliantVendors, color: "var(--bs-danger)" },
    { name: "Pending Review", value: compliance.pendingReviewVendors, color: "var(--bs-warning)" }
  ] : [];
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Vendor Analytics</h3>
          <p className="text-muted mb-0">Evaluate supplier performance and compliance status.</p>
        </div>
        {!isVendor && (
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <FaFilter className="text-muted" />
            <Form.Select size="sm" style={{ minWidth: 200 }} value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)} className="rounded-3">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
            </Form.Select>
          </div>
        )}
      </div>

      {!isVendor && compliance && <Row className="g-4 mb-4">
          <Col xs={12} lg={4}>
            <ChartCard title="Overall Compliance Status" loading={loading} height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
    data={donutData}
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={80}
    paddingAngle={5}
    dataKey="value"
    stroke="none"
  >
                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex justify-content-center gap-3 mt-2">
                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25"><FaCheckCircle className="me-1" /> {compliance.compliantVendors}</Badge>
                <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25"><FaExclamationTriangle className="me-1" /> {compliance.nonCompliantVendors}</Badge>
                <Badge bg="warning" className="bg-opacity-10 text-dark border border-warning border-opacity-25"><FaHourglassHalf className="me-1" /> {compliance.pendingReviewVendors}</Badge>
              </div>
            </ChartCard>
          </Col>
          <Col xs={12} lg={8}>
            <Row className="g-4 h-100">
              {/* <Col xs={12} sm={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100 bg-primary text-white">
                  <Card.Body className="p-4 d-flex flex-column justify-content-center">
                    <p className="small text-white-50 text-uppercase fw-bold mb-1">Document Approval Rate</p>
                    <h1 className="fw-bold mb-0 display-4">{compliance.documentApprovalRate}%</h1>
                    <ProgressBar variant="light" now={compliance.documentApprovalRate} className="mt-3 opacity-50" style={{ height: "4px" }} />
                  </Card.Body>
                </Card>
              </Col> */}
              <Col xs={12} sm={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="p-4 d-flex flex-column justify-content-center">
                    <p className="small text-muted text-uppercase fw-bold mb-1">Total Active Vendors</p>
                    <h1 className="fw-bold text-dark mb-0 display-4">{compliance.totalVendors}</h1>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>}

    </div>;
};
export {
  VendorAnalytics
};
