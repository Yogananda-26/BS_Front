import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Card, Badge, Row, Col, Modal, Form, Spinner } from "react-bootstrap";
import { FaPlus, FaTools, FaUsers, FaBoxOpen, FaEdit, FaTrash } from "react-icons/fa";
import { resourceService } from "../../services/resourceService";
import { toast } from "react-toastify";

const AVAILABILITY_COLORS = {
  Available:   "success",
  Unavailable: "danger",
  Maintenance: "warning",
};

const EMPTY_FORM = {
  type:           "Labor",
  availability:   "Available",
  numberOfLabors: 1,
  skillLevel:     "Skilled",
  equipmentName:  "",
  equipmentLevel: "Heavy",
  costPerHour:    0,
  totalHours:     0,   // UI-only helper — used to calculate totalCost before submit
};

/* ─── Resource Modal (Create / Edit) ─────────────────────────────────────── */
const ResourceModal = ({ show, onHide, onCreated, editingResource }) => {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill when editing; reset when creating
  useEffect(() => {
    if (editingResource) {
      setForm({
        type:           editingResource.type           || "Labor",
        availability:   editingResource.availability   || "Available",
        numberOfLabors: editingResource.numberOfLabors ?? 1,
        skillLevel:     editingResource.skillLevel     || "Skilled",
        equipmentName:  editingResource.equipmentName  || "",
        equipmentLevel: editingResource.equipmentLevel || "Heavy",
        costPerHour:    editingResource.costPerHour    ?? 0,
        totalHours:     0,   // not stored in DTO — user re-enters if they want to recalculate
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingResource, show]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setNum = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: Number(e.target.value) }));

  // Estimated cost shown in the form (UI-only)
  const estimatedCost =
    (form.type === "LABOR" ? form.numberOfLabors || 0 : 1) *
    (form.costPerHour || 0) *
    (form.totalHours  || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Field caps ---
    // Cost per hour: max $2000 for any resource type
    // Total hours: max 24 for Labor, 48 for Equipment
    const costCap = 2000;
    const hoursCap = form.type === "Equipment" ? 48 : 24;

    if ((form.costPerHour || 0) > costCap) {
      toast.error(`Cost per hour cannot exceed $${costCap}.`);
      return;
    }
    if ((form.totalHours || 0) > hoursCap) {
      toast.error(
        `Total hours for ${form.type === "Equipment" ? "equipment" : "labor"} cannot exceed ${hoursCap} hours.`
      );
      return;
    }

    setSubmitting(true);

    // Match exact casing the backend expects (title-case enums)
    const payload = {
      type:                form.type,
      availability:        form.availability,
      numberOfLabors:      form.type === "Labor"     ? (form.numberOfLabors || 0) : 0,
      skillLevel:          form.type === "Labor"     ? form.skillLevel            : "Skilled",
      equipmentName:       form.type === "Equipment" ? form.equipmentName         : "",
      equipmentLevel:      form.type === "Equipment" ? form.equipmentLevel        : "Heavy",
      costPerHour:         form.costPerHour || 0,
      totalCost:           estimatedCost,
      // Pass remaining backend fields as empty — backend accepts but does not require values
      totalHours:          form.totalHours || 0,
      projectId:           "",
      issueId:             "",
      siteId:              "",
      siteEngineerUserId:  "",
      purpose:             "",
    };

    try {
      if (editingResource?.resourceId) {
        await resourceService.updateResource(editingResource.resourceId, payload);
        toast.success("Resource updated successfully");
      } else {
        await resourceService.addResource(payload);
        toast.success("Resource added successfully");
      }
      onCreated();
      onHide();
    } catch (err) {
      console.error("Failed to save resource:", err);
      toast.error(err?.response?.data?.message || "Failed to save resource");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">
          {editingResource ? "Edit Resource" : "Add New Resource"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">

            {/* Type + Availability */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">RESOURCE TYPE</Form.Label>
                <Form.Select value={form.type} onChange={set("type")} className="rounded-3">
                  <option value="Labor">Labor</option>
                  <option value="Equipment">Equipment</option>
                  
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">AVAILABILITY</Form.Label>
                <Form.Select value={form.availability} onChange={set("availability")} className="rounded-3">
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Maintenance">Maintenance</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* LABOR-specific fields */}
            {form.type === "Labor" && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">NUMBER OF LABORS</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      value={form.numberOfLabors}
                      onChange={setNum("numberOfLabors")}
                      className="rounded-3"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">SKILL LEVEL</Form.Label>
                    <Form.Select value={form.skillLevel} onChange={set("skillLevel")} className="rounded-3">
                      <option value="Skilled">Skilled</option>
                      <option value="Semi-Skilled">Semi-Skilled</option>
                      <option value="Unskilled">Unskilled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </>
            )}

            {/* EQUIPMENT-specific fields */}
            {form.type === "Equipment" && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">EQUIPMENT NAME</Form.Label>
                    <Form.Control
                      value={form.equipmentName}
                      onChange={set("equipmentName")}
                      className="rounded-3"
                      placeholder="e.g. Excavator"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">EQUIPMENT LEVEL</Form.Label>
                    <Form.Select value={form.equipmentLevel} onChange={set("equipmentLevel")} className="rounded-3">
                      <option value="Heavy">Heavy</option>
                      <option value="Medium">Medium</option>
                      <option value="Light">Light</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </>
            )}

            {/* Cost inputs */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">COST PER HOUR ($)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  max={2000}
                  value={form.costPerHour}
                  onChange={setNum("costPerHour")}
                  className="rounded-3"
                  isInvalid={(form.costPerHour || 0) > 2000}
                />
                <Form.Text className="text-muted">Max $2000 per hour</Form.Text>
                <Form.Control.Feedback type="invalid">
                  Cost per hour cannot exceed $2000.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">TOTAL HOURS</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  max={form.type === "Equipment" ? 48 : 24}
                  value={form.totalHours}
                  onChange={setNum("totalHours")}
                  className="rounded-3"
                  isInvalid={(form.totalHours || 0) > (form.type === "Equipment" ? 48 : 24)}
                />
                <Form.Text className="text-muted">
                  Max {form.type === "Equipment" ? 48 : 24} hours for {form.type === "Equipment" ? "equipment" : "labor"}
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  Total hours cannot exceed {form.type === "Equipment" ? 48 : 24}.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">ESTIMATED TOTAL COST</Form.Label>
                <div className="fs-4 fw-bold text-success pt-1">${estimatedCost.toLocaleString()}</div>
              </Form.Group>
            </Col>

          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton variant="success" type="submit" className="rounded-3 px-4" disabled={submitting}>
              {submitting
                ? (editingResource ? "Updating..." : "Adding...")
                : (editingResource ? "Update Resource" : "Add Resource")}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

/* ─── ResourcesPage ──────────────────────────────────────────────────────── */
const ResourcesPage = () => {
  const [resources, setResources]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load resources:", err);
      toast.error("Failed to load resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowModal(true);
  };

  const handleDeleteClick = (resource) => {
    setResourceToDelete(resource);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    try {
      await resourceService.deleteResource(resourceToDelete.resourceId || resourceToDelete.id);
      toast.success("Resource deleted successfully");
      setShowDeleteModal(false);
      setResourceToDelete(null);
      load();
    } catch (err) {
      console.error("Failed to delete resource:", err);
      toast.error("Failed to delete resource");
    }
  };

  const getIcon = (type) => {
    if (type === "Labor")     return <FaUsers   className="text-primary" />;
    if (type === "Equipment") return <FaTools   className="text-warning" />;
    return                           <FaBoxOpen className="text-info"    />;
  };

  const getLabel = (res) => {
    if (res.type === "Labor")     return `${res.numberOfLabors || 0}× ${res.skillLevel || "General"} Labor`;
    if (res.type === "Equipment") return res.equipmentName || "Equipment";
    return "Material";
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Resource Management</h3>
          <p className="text-muted mb-0">Track labor, equipment, and materials.</p>
        </div>
        <AppButton
          variant="success"
          className="rounded-3 d-flex align-items-center gap-2"
          onClick={() => { setEditingResource(null); setShowModal(true); }}
        >
          <FaPlus /> Add Resource
        </AppButton>
      </div>

      {/* Resource Cards */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-2">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <FaBoxOpen size={48} className="text-muted mb-3 opacity-25" />
          <h5 className="text-muted">No resources found</h5>
          <p className="text-muted small">Start by adding labor, equipment or materials.</p>
        </div>
      ) : (
        <Row className="g-4">
          {resources.map((res) => {
            const avColor = AVAILABILITY_COLORS[res.availability] || "secondary";
            return (
              <Col md={6} lg={4} key={res.resourceId || res.id}>
                <Card className="border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden">
                  {/* Availability ribbon */}
                  <div
                    className={`position-absolute top-0 end-0 p-2 px-3 bg-${avColor} bg-opacity-10 text-${avColor} rounded-bottom-start small fw-bold`}
                  >
                    {(res.availability || "").replace("_", " ")}
                  </div>

                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="bg-light p-3 rounded-4">{getIcon(res.type)}</div>
                      <div>
                        <h6 className="fw-bold mb-0">{getLabel(res)}</h6>
                        <div className="small text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
                          {res.type}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">Cost / hr</div>
                        <div className="fw-semibold">${(res.costPerHour || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="small text-muted">Total Cost</div>
                        <div className="fw-bold text-success">${(res.totalCost || 0).toLocaleString()}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <AppButton
                          variant="outline-primary"
                          size="sm"
                          className="rounded-3"
                          onClick={() => handleEdit(res)}
                          title="Edit resource"
                        >
                          <FaEdit />
                        </AppButton>
                        <AppButton
                          variant="outline-danger"
                          size="sm"
                          className="rounded-3"
                          onClick={() => handleDeleteClick(res)}
                          title="Delete resource"
                        >
                          <FaTrash />
                        </AppButton>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Add / Edit Modal */}
      <ResourceModal
        show={showModal}
        onHide={() => { setShowModal(false); setEditingResource(null); }}
        onCreated={load}
        editingResource={editingResource}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Delete Resource</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this resource? This action cannot be undone.</p>
          {resourceToDelete && (
            <div className="bg-light p-3 rounded-3 small">
              <div><strong>Type:</strong> {resourceToDelete.type}</div>
              <div><strong>Resource:</strong> {getLabel(resourceToDelete)}</div>
              <div><strong>Total Cost:</strong> ${(resourceToDelete.totalCost || 0).toLocaleString()}</div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light"   onClick={() => setShowDeleteModal(false)} className="rounded-3">Cancel</AppButton>
          <AppButton variant="danger"  onClick={handleDeleteConfirm}             className="rounded-3">Delete</AppButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export { ResourcesPage };