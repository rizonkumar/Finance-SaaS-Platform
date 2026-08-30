"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  /** Accessible name for the icon-only trigger, e.g. "Account actions". */
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  /** Extra items rendered between Edit and Delete. */
  children?: React.ReactNode;
};

export const RowActions = ({
  label,
  onEdit,
  onDelete,
  disabled,
  children,
}: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={label}>
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem disabled={disabled} onClick={onEdit}>
        <Edit className="mr-2 size-4" />
        Edit
      </DropdownMenuItem>
      {children}
      <DropdownMenuItem disabled={disabled} onClick={onDelete}>
        <Trash className="mr-2 size-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
