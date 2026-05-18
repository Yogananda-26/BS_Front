import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Button, Form, Modal, Alert } from "react-bootstrap";
import { FaCheckCircle, FaTimesCircle, FaDollarSign, FaFileInvoice } from "react-icons/fa";
import { financeService } from "../../services/financeService";
import { toast } from "react-toastify";
const FinanceApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState("budgets");
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsData, expensesData] = await Promise.all([
        financeService.getPendingBudgets(),
        financeService.getPendingExpenses()
      ]);
      setBudgets(budgetsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to load finance approvals:", error);
      toast.error("Failed to load finance approvals");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const handleApproveBudget = async (budgetId) => {
    setProcessing(true);
    try {
      await financeService.approveFinanceBudget(budgetId);
      toast.success("Budget approved successfully");
      loadData();
    } catch (error) {
      console.error("Failed to approve budget:", error);
      toast.error("Failed to approve budget");
    } finally {
      setProcessing(false);
    }
  };
  const handleRejectBudget = (budget) => {
    setSelectedItem(budget);
    setShowRejectModal(true);
  };
  const handleApproveExpense = async (expenseId) => {
    setProcessing(true);
    try {
      await financeService.approveFinanceExpense(expenseId);
      toast.success("Expense approved successfully");
      loadData();
    } catch (error) {
      console.error("Failed to approve expense:", error);
      toast.error("Failed to approve expense");
    } finally {
      setProcessing(false);
    }
  };
  const handleRejectExpense = (expense) => {
    setSelectedItem(expense);
    setShowRejectModal(true);
  };
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    try {
      if (activeTab === "budgets") {
        await financeService.rejectBudget(selectedItem.budgetId, rejectionReason);
        toast.success("Budget rejected successfully");
      } else {
        await financeService.rejectExpense(selectedItem.expenseId, rejectionReason);
        toast.success("Expense rejected successfully");
      }
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject");
    } finally {
      setProcessing(false);
    }
  };
  return <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Finance Approvals</h3>
        <p className="text-muted mb-0">Review and approve budget requests and expenses.</p>
      </div>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex gap-2">
            <AppButton
    variant={activeTab === "budgets" ? "primary" : "outline-secondary"}
    onClick={() => setActiveTab("budgets")}
    className="rounded-3"
  >
              <FaDollarSign className="me-2" />
              Budgets ({budgets.length})
            </AppButton>
            <AppButton
    variant={activeTab === "expenses" ? "primary" : "outline-secondary"}
    onClick={() => setActiveTab("expenses")}
    className="rounded-3"
  >
              <FaFileInvoice className="me-2" />
              Expenses ({expenses.length})
            </AppButton>
          </div>
        </Card.Body>
      </Card>

      {loading ? <div className="text-center py-5 text-muted">Loading...</div> : activeTab === "budgets" ? <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-4">
            {budgets.length === 0 ? <Alert variant="info" className="rounded-4">No pending budget approvals</Alert> : <AppTable
                columns={['Project', 'Category', 'Planned Amount', 'Created By', 'Date', 'Actions']}
                responsive
                isEmpty={budgets.length === 0}
              >
                  {budgets.map((budget) => <tr key={budget.budgetId}>
                      <td className="py-3 px-4">{budget.projectName}</td>
                      <td className="py-3 px-4">
                        <Badge bg="light" text="dark" className="border">{budget.budgetCategory}</Badge>
                      </td>
                      <td className="py-3 px-4 fw-bold">${budget.plannedAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">{budget.createdByName}</td>
                      <td className="py-3 px-4 small">{new Date(budget.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="d-flex gap-2">
                          <AppButton
    variant="outline-success"
    size="sm"
    className="rounded-3"
    onClick={() => handleApproveBudget(budget.budgetId)}
    disabled={processing}
  >
                            <FaCheckCircle />
                          </AppButton>
                          <AppButton
    variant="outline-danger"
    size="sm"
    className="rounded-3"
    onClick={() => handleRejectBudget(budget)}
    disabled={processing}
  >
                            <FaTimesCircle />
                          </AppButton>
                        </div>
                      </td>
                    </tr>)}
              </AppTable>}
          </Card.Body>
        </Card> : <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-4">
            {expenses.length === 0 ? <Alert variant="info" className="rounded-4">No pending expense approvals</Alert> : <AppTable
                columns={['Project', 'Type', 'Description', 'Amount', 'Date', 'Actions']}
                responsive
                isEmpty={expenses.length === 0}
              >
                  {expenses.map((expense) => <tr key={expense.expenseId}>
                      <td className="py-3 px-4">{expense.projectId}</td>
                      <td className="py-3 px-4">
                        <Badge bg="light" text="dark" className="border">{expense.expenseType}</Badge>
                      </td>
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4 fw-bold">${expense.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 small">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="d-flex gap-2">
                          <AppButton
    variant="outline-success"
    size="sm"
    className="rounded-3"
    onClick={() => handleApproveExpense(expense.expenseId)}
    disabled={processing}
  >
                            <FaCheckCircle />
                          </AppButton>
                          <AppButton
    variant="outline-danger"
    size="sm"
    className="rounded-3"
    onClick={() => handleRejectExpense(expense)}
    disabled={processing}
  >
                            <FaTimesCircle />
                          </AppButton>
                        </div>
                      </td>
                    </tr>)}
              </AppTable>}
          </Card.Body>
        </Card>}

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Reject {activeTab === "budgets" ? "Budget" : "Expense"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="fw-bold">Rejection Reason *</Form.Label>
            <Form.Control
    as="textarea"
    rows={3}
    value={rejectionReason}
    onChange={(e) => setRejectionReason(e.target.value)}
    placeholder="Please provide a reason for rejection..."
    required
  />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" onClick={() => setShowRejectModal(false)} className="rounded-3">Cancel</AppButton>
          <AppButton variant="danger" onClick={handleRejectConfirm} disabled={processing} className="rounded-3">
            {processing ? "Rejecting..." : "Reject"}
          </AppButton>
        </Modal.Footer>
      </Modal>
    </div>;
};
export {
  FinanceApprovalsPage
};
