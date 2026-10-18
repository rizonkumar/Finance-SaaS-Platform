import { Split, TriangleAlert } from "lucide-react";

import { useOpenCategory } from "@/features/categories/hooks/use-open-category";

import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";

import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/transaction-export";

type Props = {
  id: string;
  category: string | null;
  categoryId: string | null;
  transferId: string | null;
  splits: { category: string | null }[];
};

export const CategoryColumn = ({
  id,
  category,
  categoryId,
  transferId,
  splits,
}: Props) => {
  const { onOpen: onOpenCategory } = useOpenCategory();
  const { onOpen: onOpenTransaction } = useOpenTransaction();

  const onClick = () => {
    if (categoryId) {
      onOpenCategory(categoryId);
    } else {
      onOpenTransaction(id);
    }
  };

  if (transferId) {
    return (
      <span className="text-gray-700" title="Transfers are not categorised">
        —
      </span>
    );
  }

  if (splits.length > 0) {
    return (
      <button
        type="button"
        onClick={() => onOpenTransaction(id)}
        title={categoryLabel({ transferId, category, splits })}
        className="flex items-center gap-x-1.5 hover:underline"
      >
        <Split className="size-4 shrink-0 text-gray-800" />
        Split · {splits.length}
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center hover:underline",
        !category && "text-red-900"
      )}
    >
      {!category && <TriangleAlert className="mr-2 size-4 shrink-0" />}
      {category || "Uncategorized"}
    </div>
  );
};
