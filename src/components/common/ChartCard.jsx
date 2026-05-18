import { Card, Spinner } from "react-bootstrap";
const ChartCard = ({ title, loading, children, height = 300 }) => {
  return <Card className="h-100 border-0 shadow-sm rounded-4">
      <Card.Body className="p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold text-dark mb-0">{title}</h6>
        </div>
        <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center" style={{ minHeight: height }}>
          {loading ? <div className="text-center text-muted">
              <Spinner animation="border" variant="secondary" size="sm" className="me-2" />
              Loading data...
            </div> : children}
        </div>
      </Card.Body>
    </Card>;
};
export {
  ChartCard
};
