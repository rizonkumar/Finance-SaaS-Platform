"use client";

import { useTheme } from "next-themes";
import type { Appearance } from "@clerk/types";

const SHARED: Appearance = {
  layout: { socialButtonsVariant: "blockButton" },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-none",
    card: "bg-transparent shadow-none border-none p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    footer: "bg-transparent",
  },
};

const LIGHT_VARIABLES = {
  colorPrimary: "#0F62E6",
  colorBackground: "#ffffff",
  colorText: "#1a1a1c",
  colorTextSecondary: "#63636b",
  colorInputBackground: "#ffffff",
  colorInputText: "#1a1a1c",
  borderRadius: "0.5rem",
};

const DARK_VARIABLES = {
  colorPrimary: "#4E93FF",
  colorBackground: "#141417",
  colorText: "#f0f0f2",
  colorTextSecondary: "#a3a3ad",
  colorInputBackground: "#1c1c20",
  colorInputText: "#f0f0f2",
  borderRadius: "0.5rem",
};

export function useClerkAppearance(): Appearance {
  const { resolvedTheme } = useTheme();

  return {
    ...SHARED,
    variables: resolvedTheme === "dark" ? DARK_VARIABLES : LIGHT_VARIABLES,
  };
}
