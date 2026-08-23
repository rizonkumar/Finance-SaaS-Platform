import { createPrefillSheetStore } from "@/features/create-sheet-store";

export type NewTransactionPrefill = {
  categoryId?: string | null;
};

export const useNewTransaction =
  createPrefillSheetStore<NewTransactionPrefill>();
