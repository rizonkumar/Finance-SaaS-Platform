import { createPrefillSheetStore } from "@/features/create-sheet-store";

export type RecurringPrefill = {
  payee?: string;
  amount?: string;
  accountId?: string;
  debtId?: string;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  interval?: string;
  endDate?: Date | null;
};

export const useNewRecurring = createPrefillSheetStore<RecurringPrefill>();
