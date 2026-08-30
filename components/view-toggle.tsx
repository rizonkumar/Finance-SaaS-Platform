"use client";

import { Grid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

type Props = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export const ViewToggle = ({ value, onChange }: Props) => (
  <div className="border-border flex items-center rounded-md border p-0.5">
    <Button
      type="button"
      variant={value === "grid" ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-7"
      onClick={() => onChange("grid")}
      aria-label="Grid view"
      aria-pressed={value === "grid"}
    >
      <Grid />
    </Button>
    <Button
      type="button"
      variant={value === "list" ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-7"
      onClick={() => onChange("list")}
      aria-label="List view"
      aria-pressed={value === "list"}
    >
      <List />
    </Button>
  </div>
);
