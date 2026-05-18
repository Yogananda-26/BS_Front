import { useState, useEffect, useCallback } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Form, InputGroup, Badge, Spinner, Alert } from "react-bootstrap";
import {
  FaFileDownload,
  FaSyncAlt,
  FaCalendarAlt,
  FaUser,
  FaFilter,
  FaSearch,
  FaShieldAlt,
  FaUserCog,
  FaCloudUploadAlt,
  FaCogs
} from "react-icons/fa";
import { auditService } from "../../services/auditService";

const formatAction = (action) => action.replace(/_/g, " ");

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // --- RESTORED FILTERS ---
  const [userIdFilter, setUserIdFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const PAGE_SIZE = 15;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass userIdFilter to the service as per old implementation
      const data = await auditService.getLogs(page, PAGE_SIZE, userIdFilter);
      setLogs(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error("Audit fetch error:", err);
      setError("Failed to load audit logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, userIdFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (action) => {
    const a = action.toLowerCase();
    if (a.includes("role") || a.includes("user")) return <FaUserCog />;
    if (a.includes("security") || a.includes("login") || a.includes("auth")) return <FaShieldAlt />;
    if (a.includes("upload") || a.includes("file")) return <FaCloudUploadAlt />;
    if (a.includes("config") || a.includes("system")) return <FaCogs />;
    return <FaShieldAlt />;
  };

  const isFailure = (action) => 
    action.toLowerCase().includes("fail") || 
    action.toLowerCase().includes("error") || 
    action.toLowerCase().includes("denied");

  const getInitials = (id) => {
    if (!id) return "??";
    return id.slice(0, 2).toUpperCase();
  };

  // --- RESTORED FILTER LOGIC ---
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.ipAddress?.toLowerCase().includes(query) ||
      log.userId?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Administrative Audit Logs</h2>
          <p className="text-muted mb-0 small">Real-time monitoring of system-level modifications and security events.</p>
        </div>
        <div className="d-flex gap-2">
          <AppButton variant="primary" onClick={() => loadLogs()} disabled={isLoading}>
            <FaSyncAlt className={isLoading ? "fa-spin" : ""} /> Refresh
          </AppButton>
        </div>
      </div>

      {error && <Alert variant="danger" className="rounded-4 shadow-sm">{error}</Alert>}

      {/* --- RESTORED FILTER UI --- */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <FaFilter className="text-primary" />
            <span className="fw-bold small text-uppercase text-muted">Search & Filter</span>
          </div>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Search by User ID</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0"><FaUser /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Enter user ID (e.g., BSAD001)" 
                    className="bg-light border-start-0"
                    value={userIdFilter}
                    onChange={(e) => {
                      setUserIdFilter(e.target.value);
                      setPage(0);
                    }}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Search Keywords</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0"><FaSearch /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Search action, IP address..." 
                    className="bg-light border-start-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          {(userIdFilter || searchQuery) && (
            <div className="mt-3 d-flex align-items-center gap-2">
              <AppButton 
                variant="outline-secondary" 
                size="sm" 
                className="rounded-pill px-3"
                onClick={() => {
                  setUserIdFilter("");
                  setSearchQuery("");
                  setPage(0);
                }}
              >
                Clear Filters
              </AppButton>
              {userIdFilter && <Badge bg="primary" pill className="px-3 py-2">User: {userIdFilter}</Badge>}
              {searchQuery && <Badge bg="info" pill className="px-3 py-2">Keyword: {searchQuery}</Badge>}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <AppTable
          columns={['Timestamp', 'User Profile', 'Action', 'Status']}
          loading={isLoading}
          loadingText="Fetching logs..."
          isEmpty={filteredLogs.length === 0}
          emptyText={searchQuery || userIdFilter ? "No matching audit logs found." : "No audit logs found."}
        >
          {filteredLogs.map((log, index) => {
            const failed = isFailure(log.action);
            return (
              <tr key={log.auditId} className={index % 2 === 0 ? "bg-light bg-opacity-50" : "bg-white"}>
                <td className="py-3 px-4 font-monospace small text-muted">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className={`bg-${failed ? "danger" : "primary"} text-white fw-bold rounded-circle d-flex align-items-center justify-content-center`}
                      style={{ width: "32px", height: "32px", fontSize: "11px" }}
                    >
                      {getInitials(log.userId)}
                    </div>
                    <span className="small fw-semibold font-monospace">{log.userId}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`d-flex align-items-center gap-2 small fw-bold text-${failed ? "danger" : "primary"}`}>
                    {getActionIcon(log.action)}
                    {formatAction(log.action)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge bg={failed ? "danger" : "success"} className={`px-2 py-1 bg-opacity-10 text-${failed ? "danger" : "success"} rounded`}>
                            {failed ? "FAILED" : "SUCCESS"}
                          </Badge>
                </td>
              </tr>
            );
          })}
        </AppTable>
        
        <Card.Footer className="bg-light py-3 px-4 d-flex justify-content-between align-items-center border-top">
          <span className="text-muted small fw-semibold">
            Showing <span className="text-dark fw-bold">{filteredLogs.length > 0 ? page * PAGE_SIZE + 1 : 0} - {Math.min((page + 1) * PAGE_SIZE, totalElements)}</span> of {totalElements} events
          </span>
          <div className="d-flex gap-1 align-items-center">
            <AppButton variant="outline-secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>&lt;</AppButton>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <AppButton key={i} variant={page === i ? "primary" : "outline-secondary"} size="sm" onClick={() => setPage(i)}>
                {i + 1}
              </AppButton>
            ))}
            <AppButton variant="outline-secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>&gt;</AppButton>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
};

export { AuditLogs };