"use client";

import { ArrowRight, Play } from "lucide-react";

import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RULE_MATCH_LABELS, type RuleMatch } from "@/lib/category-rules";

export type RuleRowData = {
  id: string;
  pattern: string;
  match: RuleMatch;
  category: string;
  priority: number;
};

type Props = {
  rule: RuleRowData;
  disabled?: boolean;
  onEdit: (id: string) => void;
  onApply: (id: string) => void;
  onDelete: (rule: RuleRowData) => void;
};

export const RuleRow = ({
  rule,
  disabled,
  onEdit,
  onApply,
  onDelete,
}: Props) => (
  <li className="flex items-center justify-between gap-x-4 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="copy-14 text-gray-900">
        Payee {RULE_MATCH_LABELS[rule.match]}
      </span>
      <span className="copy-14 text-gray-1000 font-medium">
        &ldquo;{rule.pattern}&rdquo;
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-gray-700" />
      <Badge variant="info">{rule.category}</Badge>
      {rule.priority > 0 && (
        <Badge variant="muted">Priority {rule.priority}</Badge>
      )}
    </div>
    <RowActions
      label="Rule actions"
      disabled={disabled}
      onEdit={() => onEdit(rule.id)}
      onDelete={() => onDelete(rule)}
    >
      <DropdownMenuItem disabled={disabled} onClick={() => onApply(rule.id)}>
        <Play className="mr-2 size-4" />
        Apply to uncategorized
      </DropdownMenuItem>
    </RowActions>
  </li>
);
