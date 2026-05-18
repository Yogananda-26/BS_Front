/**
 * validators.js — Centralized form validation for BuildSmart frontend
 *
 * Pattern:
 *   - Field validators  → return error string | null
 *   - Form validators   → return { fieldName: errorMessage } (empty object = valid)
 *   - firstError(errors) → returns first message string or null (for single-error-state forms)
 */

// ─── Field-level validators ───────────────────────────────────────────────────

/** Any non-empty value */
export const validateRequired = (value, label = "This field") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return `${label} is required.`;
  }
  return null;
};

/** Standard email format */
export const validateEmail = (value) => {
  if (!value || !value.trim()) return "Email is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value.trim())) return "Please enter a valid email address.";
  return null;
};

/** Gmail-only accounts */
export const validateGmailEmail = (value) => {
  const base = validateEmail(value);
  if (base) return base;
  if (!value.trim().toLowerCase().endsWith("@gmail.com")) {
    return "Email must be a valid Gmail account (@gmail.com).";
  }
  return null;
};

/**
 * Password strength:
 *   - At least 6 characters
 *   - 1 uppercase letter
 *   - 1 lowercase letter
 *   - 1 number
 */
export const validatePassword = (value) => {
  if (!value) return "Password is required.";
  if (
    value.length < 6 ||
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/[0-9]/.test(value)
  ) {
    return "Password must be at least 6 characters and contain 1 uppercase, 1 lowercase, and 1 number.";
  }
  return null;
};

/** Confirm password matches original */
export const validateConfirmPassword = (value, original) => {
  if (!value) return "Please confirm your password.";
  if (value !== original) return "Passwords do not match.";
  return null;
};

/** Phone — Indian mobile: exactly 10 digits, starting with 6–9 */
export const validatePhone = (value) => {
  if (!value || !value.trim()) return "Phone number is required.";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) {
    return "Phone number must be exactly 10 digits.";
  }
  if (!/^[6-9]/.test(digits)) {
    return "Phone number must start with 6, 7, 8, or 9.";
  }
  return null;
};

/** Positive monetary amount */
export const validatePositiveAmount = (value, label = "Amount") => {
  const num = Number(value);
  if (value === "" || value === null || value === undefined) {
    return `${label} is required.`;
  }
  if (isNaN(num) || num <= 0) {
    return `${label} must be greater than 0.`;
  }
  return null;
};

/** Non-empty selection from a dropdown / list */
export const validateSelection = (value, label = "Please select an option") => {
  if (!value || String(value).trim() === "") return label;
  return null;
};

/** Non-empty textarea / description that is explicitly required */
export const validateTextRequired = (value, label = "This field") => {
  if (!value || value.trim() === "") return `${label} is required.`;
  return null;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Returns the first error message from a validation result object,
 * or null if there are none.
 *
 * Usage:
 *   const errors  = validateSignupForm(formData);
 *   const message = firstError(errors);
 *   if (message) { setError(message); return; }
 */
export const firstError = (errors = {}) => {
  const msg = Object.values(errors).find((v) => v !== null && v !== undefined);
  return msg || null;
};

// ─── Form-level validators ────────────────────────────────────────────────────
// Each returns { fieldName: errorMessage | null }
// A completely empty (all-null) object means the form is valid.

/** Login form */
export const validateLoginForm = ({ email, password }) => ({
  email:    validateEmail(email),
  password: validateRequired(password, "Password"),
});

/** Sign-up form */
export const validateSignupForm = ({ name, email, phone, password }) => ({
  name:     validateRequired(name, "Full name"),
  email:    validateGmailEmail(email),
  phone:    validatePhone(phone),
  password: validatePassword(password),
});

/** Reset-password form */
export const validateResetPasswordForm = ({ password, confirmPassword }) => ({
  password:        validatePassword(password),
  confirmPassword: validateConfirmPassword(confirmPassword, password),
});

/** Create budget form */
export const validateCreateBudgetForm = ({ taskId, budgetCategory, plannedAmount }) => ({
  taskId:        validateSelection(taskId, "Please select a task."),
  budgetCategory: validateSelection(budgetCategory, "Please select a budget category."),
  plannedAmount:  validatePositiveAmount(plannedAmount, "Planned amount"),
});

/** Edit budget form */
export const validateEditBudgetForm = ({ budgetCategory, plannedAmount }) => ({
  budgetCategory: validateSelection(budgetCategory, "Please select a budget category."),
  plannedAmount:  validatePositiveAmount(plannedAmount, "Planned amount"),
});

/** Create expense form — LABOUR type (manual amount) */
export const validateLabourExpenseForm = ({ budgetId, amount }) => ({
  budgetId: validateSelection(budgetId, "Please select a budget."),
  amount:   validatePositiveAmount(amount, "Amount"),
});

/** Create expense form — non-LABOUR type (invoice required) */
export const validateInvoiceExpenseForm = ({ budgetId, invoiceId }) => ({
  budgetId:  validateSelection(budgetId, "Please select a budget."),
  invoiceId: validateSelection(invoiceId, "Please select an approved invoice."),
});

/** Edit expense form */
export const validateEditExpenseForm = ({ amount }) => ({
  amount: validatePositiveAmount(amount, "Amount"),
});

/** Create payment form (Step 2) */
export const validateCreatePaymentForm = ({ paymentMethod, expenseId }) => ({
  paymentMethod: validateSelection(paymentMethod, "Payment method is required."),
  expenseId:     validateTextRequired(expenseId, "Expense ID"),
});

/** Update payment status form */
export const validatePaymentStatusForm = ({ newStatus, rejectionReason }) => ({
  rejectionReason:
    newStatus === "REJECTED"
      ? validateTextRequired(rejectionReason, "Rejection reason")
      : null,
});

/** Finance task submit form */
export const validateTaskSubmitForm = ({ description }) => ({
  description: validateTextRequired(description, "Description"),
});
