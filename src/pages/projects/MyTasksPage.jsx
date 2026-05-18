import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Card, Badge, Button, Modal, Form } from "react-bootstrap";
import { FaArrowRight } from "react-icons/fa";
import projectService from "../../services/projectService";
const COLUMNS = [
  { key: "NOT_STARTED", label: "To Do", color: "secondary" },
  { key: "IN_PROGRESS", label: "In Progress", color: "primary" },
  { key: "COMPLETED", label: "Completed", color: "success" }
];
const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  useEffect(() => {
    projectService.getMyTasks().then((data) => {
      setTasks(data);
      setLoading(false);
    });
  }, []);
  const openEdit = (task) => {
    setEditTask(task);
    setNewStatus(task.status);
  };
  const handleSave = async () => {
    if (!editTask) return;
    await projectService.updateTaskStatus(editTask.taskId, newStatus);
    setTasks((prev) => prev.map((t) => t.taskId === editTask.taskId ? { ...t, status: newStatus } : t));
    setEditTask(null);
  };
  const moveToNext = async (task) => {
    const order = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    const nextIdx = order.indexOf(task.status) + 1;
    if (nextIdx >= order.length) return;
    const next = order[nextIdx];
    await projectService.updateTaskStatus(task.taskId, next);
    setTasks((prev) => prev.map((t) => t.taskId === task.taskId ? { ...t, status: next } : t));
  };
  return <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">My Tasks</h3>
        <p className="text-muted mb-0">Manage tasks assigned to you across all projects.</p>
      </div>

      {loading ? <div className="text-center py-5 text-muted">Loading your tasks...</div> : <div className="d-flex gap-4 overflow-auto pb-3" style={{ minHeight: "60vh" }}>
          {COLUMNS.map((col) => {
    const colTasks = tasks.filter((t) => t.status === col.key);
    return <div key={col.key} style={{ minWidth: "300px", flex: 1 }}>
                <div className={`d-flex align-items-center gap-2 mb-3 p-3 rounded-3 bg-${col.color} bg-opacity-10`}>
                  <span className={`fw-bold text-${col.color}`}>{col.label}</span>
                  <Badge bg={col.color} pill>{colTasks.length}</Badge>
                </div>
                <div className="d-flex flex-column gap-3">
                  {colTasks.length === 0 ? <div className="text-center py-4 text-muted small border border-dashed rounded-3">No tasks here</div> : colTasks.map((task) => <Card
      key={task.taskId}
      className="border-0 shadow-sm rounded-4"
      style={{ cursor: "pointer", transition: "transform 0.15s" }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = ""}
    >
                      <Card.Body className="p-3">
                        <p className="fw-semibold mb-2 small">{task.description}</p>
                        <div className="small text-muted mb-2">
                          <Badge bg="light" text="dark" className="border me-1">{task.assignedDepartment.replace("_", " ")}</Badge>
                        </div>
                        <div className="small text-muted mb-3">Due: {task.plannedEnd}</div>
                        <div className="d-flex gap-1">
                          <AppButton size="sm" variant="outline-secondary" className="rounded-3 flex-grow-1 py-1" onClick={() => openEdit(task)}>
                            Edit
                          </AppButton>
                          {task.status !== "COMPLETED" && <AppButton size="sm" variant={`outline-${col.color}`} className="rounded-3 px-2" onClick={() => moveToNext(task)} title="Move to next stage">
                              <FaArrowRight size={10} />
                            </AppButton>}
                        </div>
                      </Card.Body>
                    </Card>)}
                </div>
              </div>;
  })}
        </div>}

      {
    /* Edit Task Modal */
  }
      <Modal show={!!editTask} onHide={() => setEditTask(null)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-6">Update Task Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">{editTask?.description}</p>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">STATUS</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="rounded-3">
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setEditTask(null)}>Cancel</AppButton>
          <AppButton variant="primary" className="rounded-3" onClick={handleSave}>Save Changes</AppButton>
        </Modal.Footer>
      </Modal>
    </div>;
};
export {
  MyTasksPage
};
