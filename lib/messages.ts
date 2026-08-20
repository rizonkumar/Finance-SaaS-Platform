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
  | "Payment";

export const toastMessages = (resource: ResourceLabel) => ({
  createSuccess: `${resource} created`,
  createError: `Could not create ${resource.toLowerCase()}`,
  updateSuccess: `${resource} updated`,
  updateError: `Could not update ${resource.toLowerCase()}`,
  deleteSuccess: `${resource} deleted`,
  deleteError: `Could not delete ${resource.toLowerCase()}`,
  bulkDeleteSuccess: `${resource}s deleted`,
  bulkDeleteError: `Could not delete ${resource.toLowerCase()}s`,
});

export const API_ERRORS = {
  unauthorized: "Unauthorized",
  missingId: "Missing id",
  notFound: "Not found",
  internal: "Something went wrong. Try again.",
} as const;
