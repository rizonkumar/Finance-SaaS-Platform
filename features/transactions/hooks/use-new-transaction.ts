import { createPrefillSheetStore } from "@/features/create-sheet-store";

export type NewTransactionPrefill = {
  accountId?: string | null;
  categoryId?: string | null;
};

export const useNewTransaction =
  createPrefillSheetStore<NewTransactionPrefill>();
