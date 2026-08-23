import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type PageChip = {
  label: string;
  icon?: LucideIcon;
};

type Props = {
  title: string;
  description?: string;
  chips?: PageChip[];
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

export const PageHeader = ({
  title,
  description,
  chips,
  filters,
  actions,
}: Props) => {
  const hasMetaRow = (chips && chips.length > 0) || Boolean(filters);

  return (
    <header className="mb-4 flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-3 sm:flex-row sm:items-start sm:justify-between sm:gap-x-4">
        <div className="min-w-0 space-y-1">
          <h1 className="heading-24 text-gray-1000">{title}</h1>
          {description && (
            <p className="copy-14 text-gray-900">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {hasMetaRow && (
        <div className="flex flex-wrap items-center gap-2">
          {chips?.map(({ label, icon: Icon }) => (
            <Badge key={label} variant="muted">
              {Icon && <Icon className="size-3" />}
              {label}
            </Badge>
          ))}
          {filters}
        </div>
      )}
    </header>
  );
};
