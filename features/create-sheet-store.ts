import { create } from "zustand";

type NewSheetState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type OpenSheetState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export const createNewSheetStore = () =>
  create<NewSheetState>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  }));

type PrefillSheetState<TPrefill> = {
  isOpen: boolean;
  prefill?: TPrefill;
  onOpen: (prefill?: TPrefill) => void;
  onClose: () => void;
};

export const createPrefillSheetStore = <TPrefill>() =>
  create<PrefillSheetState<TPrefill>>((set) => ({
    isOpen: false,
    prefill: undefined,
    onOpen: (prefill) => set({ isOpen: true, prefill }),
    onClose: () => set({ isOpen: false, prefill: undefined }),
  }));

export const createOpenSheetStore = () =>
  create<OpenSheetState>((set) => ({
    id: undefined,
    isOpen: false,
    onOpen: (id: string) => set({ isOpen: true, id }),
    onClose: () => set({ isOpen: false, id: undefined }),
  }));
