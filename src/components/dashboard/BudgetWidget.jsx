import { Card, ProgressBar } from "react-bootstrap";
const BudgetWidget = ({
  title,
  allocated,
  spent,
  percentage,
  statusText,
  remainingText
}) => {
  return <Card className="h-100 border-0 shadow-sm rounded-4">
      <Card.Body className="p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
        <div className="flex-grow-1">
          <span className="small text-uppercase fw-bold text-muted tracking-wider d-block mb-2">{title}</span>
          <div className="d-flex align-items-baseline gap-2">
            <h2 className="display-6 fw-bold text-dark mb-0">{spent}</h2>
            <span className="text-muted">/ {allocated} allocated</span>
          </div>
        </div>
        
        <div className="flex-grow-1 w-100">
          <ProgressBar variant="primary" now={percentage} style={{ height: "12px" }} className="rounded-pill" />
        </div>
        
        <div className="d-flex flex-column align-items-md-end">
          <span className="badge bg-success bg-opacity-10 text-success mb-1">{statusText}</span>
          <span className="small text-muted">{remainingText}</span>
        </div>
      </Card.Body>
    </Card>;
};
export {
  BudgetWidget
};
