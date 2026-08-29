import { createPrefillSheetStore } from "@/features/create-sheet-store";
import type { RecurringPrefill } from "@/features/recurring/debt-prefill";

export const useNewRecurring = createPrefillSheetStore<RecurringPrefill>();
