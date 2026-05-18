import { useState, useEffect } from "react";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Badge, Form, InputGroup } from "react-bootstrap";
import { FaUsers, FaUserCheck, FaUserTimes, FaUserSlash, FaSearch } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import mockService from "../../services/analyticsService";
import { ChartCard } from "../../components/common/ChartCard";
import { useAuth } from "../../context/AuthContext";
const UserAnalytics = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await mockService.getAllUsersList(user?.role) || [];
        const realStats = {
          totalUsers: usersRes.length,
          activeUsers: usersRes.filter((u) => u && u.status === "ACTIVE").length,
          inactiveUsers: usersRes.filter((u) => u && u.status === "INACTIVE").length,
          suspendedUsers: usersRes.filter((u) => u && u.status === "SUSPENDED").length,
          usersByRole: usersRes.reduce((acc, u) => {
            if (u && u.role) {
              acc[u.role] = (acc[u.role] || 0) + 1;
            }
            return acc;
          }, {})
        };
        setSummary(realStats);
        setUsers(usersRes);
      } catch (e) {
        console.error("UserAnalytics Fetch Error:", e);
        setSummary({
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          suspendedUsers: 0,
          usersByRole: {}
        });
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">Active</Badge>;
      case "INACTIVE":
        return <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25">Inactive</Badge>;
      case "SUSPENDED":
        return <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">Suspended</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };
  const roleData = summary ? Object.entries(summary.usersByRole).map(([name, value]) => ({
    name: name.replace("_", " "),
    value
  })) : [];
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase())
  );
  return <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">User Analytics</h3>
        <p className="text-muted mb-0">Overview of system access, role distribution, and user status.</p>
      </div>

      {summary && <Row className="g-4 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Total Users</p>
                  <h2 className="fw-bold text-dark mb-0">{summary.totalUsers}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                  <FaUsers size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Active</p>
                  <h2 className="fw-bold text-success mb-0">{summary.activeUsers}</h2>
                </div>
                <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                  <FaUserCheck size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Inactive</p>
                  <h2 className="fw-bold text-secondary mb-0">{summary.inactiveUsers}</h2>
                </div>
                <div className="bg-secondary bg-opacity-10 text-secondary p-3 rounded-circle">
                  <FaUserTimes size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Suspended</p>
                  <h2 className="fw-bold text-danger mb-0">{summary.suspendedUsers}</h2>
                </div>
                <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
                  <FaUserSlash size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>}

      <Row className="g-4 mb-4">

        <Col >
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <h5 className="fw-bold mb-0">System Users List</h5>
              <InputGroup style={{ maxWidth: "300px" }}>
                <InputGroup.Text className="bg-light border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                <Form.Control
    placeholder="Search users..."
    className="bg-light border-start-0"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
              </InputGroup>
            </Card.Header>
            <AppTable
              columns={['Name / Email', 'Role', 'Status']}
              loading={loading}
              loadingText="Loading users..."
              isEmpty={filteredUsers.length === 0}
              emptyText={users.length === 0 ? "Failed to load user data." : `No users found matching "${search}".`}
            >
              {filteredUsers.map((user2) => <tr key={user2.id || user2.userId}>
                        <td className="py-3 px-4">
                          <div className="fw-bold text-dark">{user2.name || "Unknown User"}</div>
                          <div className="small text-muted">{user2.email || "No email"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge bg="light" text="dark" className="border text-uppercase">
                            {user2.role ? user2.role.replace("_", " ") : "USER"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(user2.status || "ACTIVE")}
                        </td>
                      </tr>)}
            </AppTable>
          </Card>
        </Col>
      </Row>
    </div>;
};
export {
  UserAnalytics
};
