import { Card, ListGroup } from "react-bootstrap";
import { AppButton } from "../common/AppButton";
import * as Icons from "react-icons/fa";
const RecentApprovalsList = ({ items, onViewAll }) => {
  return <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
      <Card.Header className="bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-dark mb-0">Recent Approvals</h5>
        {onViewAll && <AppButton
    className="btn btn-link text-primary p-0 text-decoration-none small text-uppercase fw-bold"
    onClick={onViewAll}
  >
            View All
          </AppButton>}
      </Card.Header>
      <ListGroup variant="flush">
        {items.map((item, index) => {
    const IconComponent = Icons[item.icon] || Icons.FaFileAlt;
    return <ListGroup.Item
      key={item.id}
      className={`p-4 d-flex align-items-center justify-content-between border-0 ${index % 2 === 0 ? "bg-light bg-opacity-50" : "bg-white"}`}
    >
              <div className="d-flex align-items-center gap-3">
                <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                  <IconComponent size={20} />
                </div>
                <div>
                  <h6 className="mb-1 text-dark fw-semibold">{item.title}</h6>
                  <p className="mb-0 small text-muted">{item.subtitle} • {item.time}</p>
                </div>
              </div>
              <Icons.FaCheckCircle className="text-success" size={20} />
            </ListGroup.Item>;
  })}
      </ListGroup>
    </Card>;
};
export {
  RecentApprovalsList
};
