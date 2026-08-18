import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-3 px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-800">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="heading-14 text-gray-1000">{title}</p>
        <p className="copy-13 max-w-sm text-gray-900">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
