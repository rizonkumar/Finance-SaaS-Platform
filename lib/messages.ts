type ResourceLabel =
  | "Account"
  | "Category"
  | "Transaction"
  | "Budget"
  | "Recurring transaction"
  | "Goal"
  | "Contribution"
  | "Transfer"
  | "Debt"
  | "Payment"
  | "Holding"
  | "Trade";

export const toastMessages = (resource: ResourceLabel) => ({
  createSuccess: `${resource} created`,
  createError: `Could not create ${resource.toLowerCase()}`,
  updateSuccess: `${resource} updated`,
  updateError: `Could not update ${resource.toLowerCase()}`,
  deleteSuccess: `${resource} deleted`,
  deleteError: `Could not delete ${resource.toLowerCase()}`,
  bulkDeleteSuccess: `${resource}s deleted`,
  bulkDeleteError: `Could not delete ${resource.toLowerCase()}s`,
  bulkCreateSuccess: `${resource}s created`,
  bulkCreateError: `Could not create ${resource.toLowerCase()}s`,
});

export const API_ERRORS = {
  unauthorized: "Your session has expired. Sign in and try again.",
  missingId: "Something went wrong. Try again.",
  notFound: "That is no longer there. Refresh the page and try again.",
  internal: "Something went wrong. Try again.",
} as const;
