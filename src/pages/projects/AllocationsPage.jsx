import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Button, Row, Col, Modal, Form, ProgressBar, Spinner, Alert } from "react-bootstrap";
import { FaLink, FaCalendarAlt, FaChartBar, FaExclamationTriangle } from "react-icons/fa";
import { resourceService } from "../../services/resourceService";
import projectService from "../../services/projectService";
const STATUS_COLORS = {
  Active: "success",
  Released: "primary",
  Pending: "warning"
};
const CreateAllocationModal = ({ resources, projects, show, onHide, onCreated }) => {
  const [form, setForm] = useState({
    projectId: "",
    resource: null,
    assignedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    releasedDate: "",
    status: "Active",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.resource || !form.projectId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        projectId: form.projectId,
        resource: form.resource,
        assignedDate: form.assignedDate,
        releasedDate: form.releasedDate || form.assignedDate,
        status: form.status,
        issueId: "",
        siteId: "",
      };
      await resourceService.createAllocation(payload);
      onCreated();
      onHide();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Allocation failed";
      setError(msg);
      console.error("Allocation failed", err);
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Create Resource Allocation</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="rounded-3 small py-2 d-flex align-items-center gap-2"><FaExclamationTriangle /> {error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group><Form.Label className="small fw-bold">PROJECT *</Form.Label>
                <Form.Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required className="rounded-3">
                  <option value="">Select Project...</option>
                  {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group><Form.Label className="small fw-bold">RESOURCE *</Form.Label>
                <Form.Select value={form.resource?.resourceId || ""} onChange={(e) => setForm({ ...form, resource: resources.find((r) => r.resourceId === e.target.value) })} required className="rounded-3">
                  <option value="">Select Resource...</option>
                  {resources.map((r) => <option key={r.resourceId} value={r.resourceId}>{r.resourceId} - {r.type}: {r.type === "Labor" ? `${r.numberOfLabors} Labors` : r.equipmentName}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}><Form.Group><Form.Label className="small fw-bold">ASSIGNED DATE *</Form.Label><Form.Control type="date" value={form.assignedDate} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} required className="rounded-3" /></Form.Group></Col>
            <Col xs={12} md={6}><Form.Group><Form.Label className="small fw-bold">RELEASED DATE</Form.Label><Form.Control type="date" value={form.releasedDate || ""} onChange={(e) => setForm({ ...form, releasedDate: e.target.value })} className="rounded-3" /></Form.Group></Col>
            
            <Col md={12}>
              <Form.Group><Form.Label className="small fw-bold">STATUS *</Form.Label>
                <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required className="rounded-3">
                  <option value="Active">Active</option>
                  <option value="Released">Released</option>
                  <option value="Pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Col>

          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="success" type="submit" className="rounded-3 px-4" disabled={submitting}>Allocate Resource</AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>;
};
const AllocationsPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const [a, r, p] = await Promise.all([
        resourceService.getAllocations().catch(() => []),
        resourceService.getResources().catch(() => []),
        projectService.getProjects().catch(() => [])
      ]);
      setAllocations(a);
      setResources(r);
      setProjects(p);
    } catch (err) {
      console.error("Failed to load allocation data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const viewCost = async (id) => {
    const cost = await resourceService.getCostAnalysis(id);
    setSelectedAlloc(cost);
  };
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div><h3 className="fw-bold mb-1">Resource Allocations</h3><p className="text-muted mb-0">Manage active assignments and track utilization costs.</p></div>
        <AppButton variant="success" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowModal(true)}><FaLink /> New Allocation</AppButton>
      </div>

      {loading ? <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-2">Loading allocations...</p>
        </div> : allocations.length === 0 ? <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <FaLink size={48} className="text-muted mb-3 opacity-25" />
          <h5 className="text-muted">No allocations found</h5>
          <p className="text-muted small">Connect resources to projects to see them here.</p>
        </div> : <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <AppTable
            columns={['Allocation ID', 'Resource', 'Project', 'Status', 'Assigned', 'Actions']}
            responsive
            isEmpty={allocations.length === 0}
          >
            {allocations.map((alloc) => {
                const res = alloc.resource || {};
                const resourceLabel = res.type === "Labor"
                  ? `${res.numberOfLabors || 1} × Labor`
                  : res.equipmentName || res.type || "Resource";
                const resourceId = res.resourceId || alloc.resourceId || "—";
                const projectName = projects.find((p) => p.projectId === alloc.projectId)?.projectName || alloc.projectName || alloc.projectId || "—";
                return <tr key={alloc.allocationId || alloc.id}>
                  <td className="py-3 px-4 fw-bold text-primary">{alloc.allocationId || "N/A"}</td>
                  <td className="py-3 px-4">
                    <div className="fw-bold">{resourceLabel}</div>
                    <div className="small text-muted font-monospace">{resourceId}</div>
                  </td>
                  <td className="py-3 px-4 small">{projectName}</td>
                  <td className="py-3 px-4"><Badge bg={STATUS_COLORS[alloc.status] || "secondary"}>{alloc.status || "—"}</Badge></td>
                  <td className="py-3 px-4 small text-muted"><FaCalendarAlt className="me-1" /> {alloc.assignedDate || "N/A"}</td>
                  <td className="py-3 px-4 text-end">
                    <AppButton variant="light" size="sm" className="rounded-3" onClick={() => viewCost(alloc.allocationId || alloc.id)}><FaChartBar className="me-1" /> Cost</AppButton>
                  </td>
                </tr>;
              })}
          </AppTable>
        </Card>}

      {selectedAlloc && <Modal show={true} onHide={() => setSelectedAlloc(null)} centered>
          <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Cost Analysis</Modal.Title></Modal.Header>
          <Modal.Body className="p-4">
            <div className="text-center mb-4">
              <h1 className="fw-bold text-success mb-0">${(selectedAlloc.actualCost || 0).toLocaleString()}</h1>
              <p className="text-muted small text-uppercase fw-bold">Actual Cost to Date</p>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between small fw-bold mb-1">
                <span>Budget Utilization</span>
                <span>{selectedAlloc.utilizationPercentage || 0}%</span>
              </div>
              <ProgressBar now={selectedAlloc.utilizationPercentage || 0} variant="success" className="rounded-pill" style={{ height: "8px" }} />
            </div>
            <Row className="g-3 text-center">
              <Col xs={6}>
                <div className="p-3 bg-light rounded-4">
                  <div className="small text-muted mb-1">Remaining</div>
                  <div className="fw-bold">${(selectedAlloc.remainingCost || 0).toLocaleString()}</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 bg-light rounded-4">
                  <div className="small text-muted mb-1">Total Allocated</div>
                  <div className="fw-bold">${(selectedAlloc.totalCost || 0).toLocaleString()}</div>
                </div>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>}

      <CreateAllocationModal resources={resources} projects={projects} show={showModal} onHide={() => setShowModal(false)} onCreated={load} />
    </div>;
};
export {
  AllocationsPage
};
