"use client";

import { BookmarkPlus } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useViewDialog } from "@/features/views/hooks/use-view-dialog";
import { isViewableRoute, pageMeta } from "@/lib/routes";
import { sanitizeViewQuery } from "@/lib/saved-views";

export const SaveViewButton = () => {
  const pathname = usePathname();
  const params = useSearchParams();
  const { onOpen } = useViewDialog();

  if (!isViewableRoute(pathname) || pathname === "/views") return null;

  const onClick = () =>
    onOpen({
      name: pageMeta(pathname)?.title ?? "",
      emoji: null,
      isPinned: false,
      route: pathname,
      query: sanitizeViewQuery(params.toString()),
    });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="hover:text-gray-1000 size-8 rounded-md text-gray-700"
          aria-label="Save this view"
        >
          <BookmarkPlus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        Save this view
      </TooltipContent>
    </Tooltip>
  );
};
