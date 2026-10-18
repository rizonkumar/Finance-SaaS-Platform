import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  emoji: string | null;
  className?: string;
};

export const ViewEmoji = ({ emoji, className }: Props) =>
  emoji ? (
    <span
      aria-hidden
      className={cn("flex size-4 shrink-0 items-center text-sm", className)}
    >
      {emoji}
    </span>
  ) : (
    <Bookmark className={cn("size-4 shrink-0", className)} />
  );
