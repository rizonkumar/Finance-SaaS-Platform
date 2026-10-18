import { useState, type JSX } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { type ImportedTransaction } from "@/lib/csv-import";
import { parseDayUTC } from "@/lib/date-utc";
import {
  convertAmountFromMiliunits,
  formatCurrency,
  pluralize,
} from "@/lib/utils";

export type DuplicateDecision = "skip" | "keep" | "cancel";

const PREVIEW_LIMIT = 5;

type Pending = {
  duplicates: ImportedTransaction[];
  resolve: (decision: DuplicateDecision) => void;
};

export const useDuplicateReview = (): [
  () => JSX.Element,
  (duplicates: ImportedTransaction[]) => Promise<DuplicateDecision>,
] => {
  const [pending, setPending] = useState<Pending | null>(null);

  const review = (duplicates: ImportedTransaction[]) =>
    new Promise<DuplicateDecision>((resolve) => {
      setPending({ duplicates, resolve });
    });

  const settle = (decision: DuplicateDecision) => {
    pending?.resolve(decision);
    setPending(null);
  };

  const duplicates = pending?.duplicates ?? [];
  const hidden = duplicates.length - PREVIEW_LIMIT;

  const DuplicateReviewDialog = () => (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => !open && settle("cancel")}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pluralize(duplicates.length, "possible duplicate")}
          </DialogTitle>
          <DialogDescription>
            These rows match transactions already in this account on the same
            day, for the same amount and payee.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-border divide-y rounded-md border">
          {duplicates.slice(0, PREVIEW_LIMIT).map((row, index) => (
            <li
              key={`${row.date}-${row.payee}-${index}`}
              className="flex items-center justify-between gap-x-4 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="copy-14 text-gray-1000 line-clamp-1">
                  {row.payee}
                </p>
                <p className="copy-13 text-gray-900">
                  {format(parseDayUTC(row.date), DISPLAY_DATE_FORMAT)}
                </p>
              </div>
              <p className="numeric shrink-0 text-sm">
                {formatCurrency(convertAmountFromMiliunits(row.amount))}
              </p>
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <p className="copy-13 text-gray-900">And {hidden} more.</p>
        )}
        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={() => settle("cancel")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => settle("keep")}>
            Import all
          </Button>
          <Button onClick={() => settle("skip")}>Skip duplicates</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [DuplicateReviewDialog, review];
};
