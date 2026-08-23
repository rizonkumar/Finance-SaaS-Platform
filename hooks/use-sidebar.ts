"use client";

import { useEffect } from "react";
import { create } from "zustand";

type SidebarState = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

const STORAGE_KEY = "fintrack-sidebar-collapsed";

export const useSidebar = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggleCollapsed: () =>
    set((state) => {
      const next = !state.isCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors (e.g. private mode)
      }
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // Ignore localStorage errors
    }
    set({ isCollapsed: collapsed });
  },
}));

/**
 * Hook to initialize sidebar state from localStorage and listen to ⌘B / Ctrl+B shortcut.
 */
export const useSidebarInit = () => {
  const { toggleCollapsed, setCollapsed } = useSidebar();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, [setCollapsed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar on Cmd+B / Ctrl+B when not actively typing in an input
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);
};
