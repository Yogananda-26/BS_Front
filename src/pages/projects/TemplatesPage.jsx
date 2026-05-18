import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Badge, Button, Modal } from "react-bootstrap";
import { FaLayerGroup } from "react-icons/fa";
import projectService from "../../services/projectService";
const TemplateDetailModal = ({ template, onHide }) => <Modal show={!!template} onHide={onHide} centered size="lg">
    <Modal.Header closeButton className="border-0">
      <Modal.Title className="fw-bold">{template?.templateName}</Modal.Title>
    </Modal.Header>
    {template && <Modal.Body className="p-4 bg-light">
        <p className="text-muted mb-4">{template.description}</p>
        <h6 className="fw-bold mb-3">Milestones</h6>
        <div className="d-flex flex-column gap-2">
          {template.milestones.map((m) => <div key={m.order} className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 32, height: 32, fontSize: 13 }}>
                {m.order}
              </div>
              <div className="flex-grow-1 fw-semibold">{m.name}</div>
              <Badge bg="light" text="dark" className="border">{m.durationWeeks} weeks</Badge>
            </div>)}
        </div>
      </Modal.Body>}
    <Modal.Footer className="border-0">
      <AppButton variant="light" className="rounded-3" onClick={onHide}>Close</AppButton>
    </Modal.Footer>
  </Modal>;
const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  useEffect(() => {
    projectService.getTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);
  const COLORS = ["primary", "success", "warning", "info", "secondary"];
  return <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Project Templates</h3>
        <p className="text-muted mb-0">Start a new project faster using a pre-configured template.</p>
      </div>

      {loading ? <div className="text-center py-5 text-muted">Loading templates...</div> : <Row className="g-4">
          {templates.map((t, idx) => <Col xs={12} md={6} lg={4} key={t.templateId}>
              <Card
    className={`border-0 shadow-sm rounded-4 h-100 cursor-pointer ${hoveredId === t.templateId ? "border-2 border-primary shadow-lg" : ""}`}
    style={{ transition: "all 0.3s ease" }}
    onMouseEnter={() => setHoveredId(t.templateId)}
    onMouseLeave={() => setHoveredId(null)}
    onClick={() => setSelected(t)}
  >
                <Card.Body className="p-4 d-flex flex-column">
                  <div className={`bg-${COLORS[idx % COLORS.length]} bg-opacity-10 text-${COLORS[idx % COLORS.length]} p-3 rounded-circle d-inline-flex mb-3`} style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}>
                    <FaLayerGroup size={22} />
                  </div>
                  <h5 className="fw-bold mb-1">{t.templateName}</h5>
                  <p className="small text-muted flex-grow-1">{t.description}</p>
                  
                  <div className="mt-3">
                    <h6 className="small fw-bold text-muted text-uppercase mb-2">Milestones</h6>
                    <div className="d-flex flex-column gap-1">
                      {t.milestones.slice(0, 3).map((m) => <div key={m.order} className="d-flex align-items-center gap-2 small">
                          <div className={`bg-${COLORS[idx % COLORS.length]} text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0`} style={{ width: 20, height: 20, fontSize: 10 }}>
                            {m.order}
                          </div>
                          <span className="text-muted">{m.name}</span>
                        </div>)}
                      {t.milestones.length > 3 && <div className="small text-muted text-center pt-1">
                          +{t.milestones.length - 3} more milestones
                        </div>}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>)}
        </Row>}

      <TemplateDetailModal template={selected} onHide={() => setSelected(null)} />
    </div>;
};
export {
  TemplatesPage
};
