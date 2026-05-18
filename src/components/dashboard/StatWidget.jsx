import { Card } from "react-bootstrap";
import * as Icons from "react-icons/fa";
const StatWidget = ({
  title,
  value,
  icon,
  iconColor = "text-primary",
  subtitle,
  borderLeftColor
}) => {
  const IconComponent = Icons[icon] || Icons.FaQuestionCircle;
  return <Card className="h-100 border-0 shadow-sm rounded-4" style={borderLeftColor ? { borderLeft: `4px solid ${borderLeftColor}` } : {}}>
      <Card.Body className="p-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <span className="small text-uppercase fw-bold text-muted tracking-wider">{title}</span>
            <IconComponent size={24} className={iconColor} />
          </div>
          <h2 className="display-5 fw-bold text-dark mb-0">{value}</h2>
        </div>
        {subtitle && <div className="mt-3 small text-muted">
            {subtitle}
          </div>}
      </Card.Body>
    </Card>;
};
export {
  StatWidget
};
