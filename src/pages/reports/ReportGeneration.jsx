import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Form, Nav, Spinner, Badge, Modal } from "react-bootstrap";
import { FaFileExport, FaEye, FaCheckCircle } from "react-icons/fa";
import analyticsService from "../../services/analyticsService";
import { toast } from "react-toastify";

const scopes = ["PROJECT", "RESOURCE", "SAFETY", "FINANCE", "VENDOR", "SITE_ENGINEER"];

const ReportGeneration = () => {
  const [scope, setScope] = useState("PROJECT");
  const [targetId, setTargetId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  // Session history — reports generated in this browser session
  const [sessionHistory, setSessionHistory] = useState([]);
  // History fetched from backend (may be empty if endpoint not available)
  const [backendHistory, setBackendHistory] = useState([]);
  const [historyScope, setHistoryScope] = useState("All");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // View modal
  const [viewReport, setViewReport] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const historyTabs = ["All", ...scopes];

  const loadBackendHistory = async (selectedScope) => {
    setIsLoadingHistory(true);
    try {
      const data = await analyticsService.getReportHistory(selectedScope);
      setBackendHistory(Array.isArray(data) ? data : []);
    } catch {
      setBackendHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadBackendHistory(historyScope);
  }, [historyScope]);

  // Merge backend + session history, deduplicate by reportId
  const mergedHistory = (() => {
    const map = new Map();
    [...backendHistory, ...sessionHistory].forEach((r) => {
      if (r?.reportId) map.set(r.reportId, r);
    });
    const all = Array.from(map.values()).sort(
      (a, b) => new Date(b.generatedDate || 0) - new Date(a.generatedDate || 0)
    );
    if (historyScope === "All") return all;
    return all.filter((r) => r.scope === historyScope);
  })();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedReport(null);
    try {
      const report = await analyticsService.generateReport(
        scope,
        scope === "PROJECT" && targetId.trim() ? targetId.trim() : undefined
      );
      if (!report) throw new Error("Empty response from server");

      const normalized = {
        reportId:      report.reportId || report.id || `RPT-${Date.now()}`,
        scope:         report.scope    || scope,
        generatedDate: report.generatedDate || report.createdAt || new Date().toISOString(),
        metrics:       report.metrics  || report.data || report,
        status:        report.status   || "COMPLETED"
      };
      setGeneratedReport(normalized);
      // Push to session history
      setSessionHistory((prev) => {
        const exists = prev.find((r) => r.reportId === normalized.reportId);
        return exists ? prev : [normalized, ...prev];
      });
      toast.success("Report generated successfully!");
    } catch (err) {
      console.error("Generate report error:", err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to generate report. Please try again.";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (report) => {
    if (!report) return;
    const blob = new Blob(
      [JSON.stringify(report.metrics ?? report, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.reportId || "report"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = async (record) => {
    setViewReport(null);
    setViewLoading(true);
    // Try to show from session cache first
    const cached = sessionHistory.find((r) => r.reportId === record.reportId);
    if (cached?.metrics) {
      setViewReport(cached);
      setViewLoading(false);
      return;
    }
    // Fetch from backend
    try {
      const full = await analyticsService.getReportById(record.reportId);
      setViewReport(full ? {
        reportId:      full.reportId || record.reportId,
        scope:         full.scope    || record.scope,
        generatedDate: full.generatedDate || record.generatedDate,
        metrics:       full.metrics  || full.data || full
      } : record);
    } catch {
      setViewReport(record);
    } finally {
      setViewLoading(false);
    }
  };

  const metricsDisplay = (metrics) => {
    if (!metrics) return "No data returned.";
    if (typeof metrics === "string") return metrics;
    return JSON.stringify(metrics, null, 2);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Report Generation &amp; History</h3>
        <p className="text-muted mb-0">Generate custom data dumps and view historical reports.</p>
      </div>

      <Row className="g-4 mb-5">
        {/* Generate Form */}
        <Col xs={12} md={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-bottom p-4">
              <h5 className="fw-bold mb-0">Generate New Report</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleGenerate}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Report Scope</Form.Label>
                  <Form.Select value={scope} onChange={(e) => { setScope(e.target.value); setTargetId(""); }} className="bg-light">
                    {scopes.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </Form.Select>
                </Form.Group>

                {scope === "PROJECT" && (
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Target Project ID (Optional)</Form.Label>
                    <Form.Control
                      placeholder="e.g. CHEBS26001"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="bg-light"
                    />
                  </Form.Group>
                )}

                <AppButton variant="primary" type="submit" disabled={isGenerating} className="w-100 fw-bold py-2 mt-2">
                  {isGenerating ? <><Spinner size="sm" className="me-2" />Generating...</> : "Generate Report"}
                </AppButton>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Result Panel */}
        <Col xs={12} md={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-dark text-white">
            <Card.Header className="border-bottom border-secondary p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-white">Generation Result</h5>
              {generatedReport && (
                <AppButton variant="outline-light" size="sm" onClick={() => handleDownload(generatedReport)}>
                  <FaFileExport className="me-2" /> Download JSON
                </AppButton>
              )}
            </Card.Header>
            <Card.Body className="p-4 overflow-auto" style={{ maxHeight: "400px" }}>
              {isGenerating ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white-50">
                  <Spinner animation="border" variant="light" className="mb-3" />
                  <p>Aggregating data from microservices...</p>
                </div>
              ) : generatedReport ? (
                <div>
                  <div className="d-flex flex-wrap gap-4 mb-3 pb-3 border-bottom border-secondary">
                    <div>
                      <span className="small text-white-50 d-block text-uppercase">Report ID</span>
                      <span className="fw-bold font-monospace">{generatedReport.reportId}</span>
                    </div>
                    <div>
                      <span className="small text-white-50 d-block text-uppercase">Scope</span>
                      <Badge bg="primary">{generatedReport.scope}</Badge>
                    </div>
                    <div>
                      <span className="small text-white-50 d-block text-uppercase">Generated</span>
                      <span>{new Date(generatedReport.generatedDate).toLocaleString()}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FaCheckCircle className="text-success" />
                      <span className="text-success small fw-bold">Success</span>
                    </div>
                  </div>
                  <pre className="text-success font-monospace small mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {metricsDisplay(generatedReport.metrics)}
                  </pre>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-white-50">
                  Select parameters and generate a report to view results here.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* History Section */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Header className="bg-white border-bottom p-0">
          <div className="p-4 pb-0">
            <h5 className="fw-bold mb-3">Report History</h5>
          </div>
          <Nav variant="tabs" className="px-4 border-bottom-0">
            {historyTabs.map((tab) => (
              <Nav.Item key={tab}>
                <Nav.Link
                  className={`border-0 border-bottom border-3 fw-semibold pb-3 px-3 ${historyScope === tab ? "border-primary text-primary bg-primary bg-opacity-10" : "border-transparent text-secondary"}`}
                  active={historyScope === tab}
                  onClick={() => setHistoryScope(tab)}
                  style={{ cursor: "pointer" }}
                >
                  {tab.replace(/_/g, " ")}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoadingHistory ? (
            <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
          ) : (
            <AppTable
              columns={["Report ID", "Scope", "Generated Date", "Actions"]}
              isEmpty={mergedHistory.length === 0}
              emptyText="No historical reports found. Generate a report above to see it here."
            >
              {mergedHistory.map((record) => (
                <tr key={record.reportId}>
                  <td className="py-3 px-4 font-monospace fw-bold">{record.reportId}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-secondary bg-opacity-10 text-dark border border-secondary border-opacity-25">
                      {record.scope}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted small">
                    {record.generatedDate ? new Date(record.generatedDate).toLocaleString() : "-"}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <AppButton
                      variant="link"
                      size="sm"
                      className="text-primary text-decoration-none p-0 me-3"
                      onClick={() => handleView(record)}
                    >
                      <FaEye className="me-1" /> View
                    </AppButton>
                    <AppButton
                      variant="link"
                      size="sm"
                      className="text-secondary text-decoration-none p-0"
                      onClick={() => handleDownload(record)}
                    >
                      <FaFileExport className="me-1" /> Export
                    </AppButton>
                  </td>
                </tr>
              ))}
            </AppTable>
          )}
        </Card.Body>
      </Card>

      {/* View Report Modal */}
      <Modal show={viewReport !== null || viewLoading} onHide={() => { setViewReport(null); setViewLoading(false); }} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {viewReport ? `Report — ${viewReport.reportId}` : "Loading Report..."}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {viewLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : viewReport ? (
            <div className="bg-dark rounded-bottom p-4">
              <div className="d-flex flex-wrap gap-4 mb-3 pb-3 border-bottom border-secondary">
                <div>
                  <span className="small text-white-50 d-block text-uppercase">Scope</span>
                  <Badge bg="primary">{viewReport.scope}</Badge>
                </div>
                <div>
                  <span className="small text-white-50 d-block text-uppercase">Generated</span>
                  <span className="text-white">{viewReport.generatedDate ? new Date(viewReport.generatedDate).toLocaleString() : "-"}</span>
                </div>
              </div>
              <pre className="text-success font-monospace small mb-0" style={{ maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {metricsDisplay(viewReport.metrics)}
              </pre>
            </div>
          ) : null}
        </Modal.Body>
        {viewReport && (
          <Modal.Footer className="border-0">
            <AppButton variant="outline-secondary" onClick={() => { setViewReport(null); setViewLoading(false); }}>Close</AppButton>
            <AppButton variant="primary" onClick={() => handleDownload(viewReport)}>
              <FaFileExport className="me-2" /> Download JSON
            </AppButton>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export { ReportGeneration };
