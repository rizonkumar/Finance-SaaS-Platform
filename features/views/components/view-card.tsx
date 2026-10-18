"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Pin, PinOff, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type SavedView } from "@/features/views/api/use-get-views";
import { ViewEmoji } from "@/features/views/components/view-emoji";
import { pageMeta } from "@/lib/routes";
import { describeViewQuery, viewHref } from "@/lib/saved-views";

type Props = {
  view: SavedView;
  disabled?: boolean;
  onOpen: (id: string) => void;
  onTogglePin: (view: SavedView) => void;
  onEdit: (view: SavedView) => void;
  onDelete: (view: SavedView) => void;
};

export const ViewCard = ({
  view,
  disabled,
  onOpen,
  onTogglePin,
  onEdit,
  onDelete,
}: Props) => {
  const PinIcon = view.isPinned ? PinOff : Pin;
  const lastOpened = view.lastOpenedAt
    ? `Opened ${formatDistanceToNow(new Date(view.lastOpenedAt), { addSuffix: true })}`
    : "Not opened yet";

  return (
    <Card className="flex flex-col gap-y-4 p-4">
      <Link
        href={viewHref(view)}
        onClick={() => onOpen(view.id)}
        className="group flex min-w-0 items-start gap-x-3"
      >
        <div className="bg-alpha-100 flex size-9 shrink-0 items-center justify-center rounded-sm text-gray-900">
          <ViewEmoji emoji={view.emoji} />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="copy-14 text-gray-1000 line-clamp-1 font-medium group-hover:underline">
            {view.name}
          </p>
          <p className="copy-13 line-clamp-1 text-gray-900">
            {pageMeta(view.route)?.title ?? view.route} ·{" "}
            {describeViewQuery(view.query)}
          </p>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-x-2">
        <p className="copy-13 line-clamp-1 text-gray-800">{lastOpened}</p>
        <div className="flex shrink-0 items-center gap-x-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onTogglePin(view)}
            aria-label={view.isPinned ? "Unpin view" : "Pin view"}
          >
            <PinIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onEdit(view)}
            aria-label="Edit view"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onDelete(view)}
            aria-label="Delete view"
          >
            <Trash />
          </Button>
        </div>
      </div>
    </Card>
  );
};
