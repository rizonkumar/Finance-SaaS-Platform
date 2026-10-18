import { createPrefillSheetStore } from "@/features/create-sheet-store";

export type ViewDraft = {
  id?: string;
  name: string;
  emoji: string | null;
  isPinned: boolean;
  route: string;
  query: string;
};

export const useViewDialog = createPrefillSheetStore<ViewDraft>();
