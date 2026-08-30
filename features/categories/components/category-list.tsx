"use client";

import { PiggyBank, Receipt } from "lucide-react";

import { BulkSelectionBar } from "@/components/bulk-selection-bar";
import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";
import { useConfirm } from "@/hooks/use-confirm";
import { getCategoryMeta } from "@/lib/categories";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

type CategoryItem = {
  id: string;
  name: string;
  transactionCount: number;
  totalExpenses: number;
  totalIncome: number;
  budgetAmount: number | null;
};

type Props = {
  categories: CategoryItem[];
  selected: string[];
  onToggleSelect: (id: string, selected: boolean) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onEdit: (id: string) => void;
  onBulkDelete: () => void;
  isDeleting: boolean;
};

export const CategoryList = ({
  categories,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onBulkDelete,
  isDeleting,
}: Props) => {
  return (
    <>
      <BulkSelectionBar
        selectedCount={selected.length}
        totalCount={categories.length}
        itemLabel={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
        onToggleSelectAll={onToggleSelectAll}
        onDelete={onBulkDelete}
        disabled={isDeleting}
      />

      <ul className="divide-border divide-y">
        {categories.map((category) => (
          <CategoryListItem
            key={category.id}
            category={category}
            isSelected={selected.includes(category.id)}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </>
  );
};

type ItemProps = {
  category: CategoryItem;
  isSelected: boolean;
  onToggleSelect: (id: string, selected: boolean) => void;
  onEdit: (id: string) => void;
};

const CategoryListItem = ({
  category,
  isSelected,
  onToggleSelect,
  onEdit,
}: ItemProps) => {
  const meta = getCategoryMeta(category.name);
  const Icon = meta.icon;
  const deleteMutation = useDeleteCategory(category.id);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    `You are about to delete the "${category.name}" category.`
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate();
    }
  };

  const spent = convertAmountFromMiliunits(category.totalExpenses);
  const budget =
    category.budgetAmount !== null
      ? convertAmountFromMiliunits(category.budgetAmount)
      : null;

  return (
    <>
      <ConfirmDialog />
      <li className="flex items-center gap-x-3 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(value) => onToggleSelect(category.id, !!value)}
          aria-label={`Select ${category.name}`}
        />

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-sm",
            meta.iconBgClass
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit(category.id)}
            className="copy-14 text-gray-1000 line-clamp-1 text-left font-medium hover:underline"
          >
            {category.name}
          </button>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="copy-13 flex items-center text-gray-900">
              <Receipt className="mr-1 inline size-3" />
              <span className="numeric">{category.transactionCount}</span>{" "}
              {category.transactionCount === 1 ? "txn" : "txns"}
            </span>
            {budget !== null && (
              <>
                <span className="text-gray-400">·</span>
                <span className="copy-13 flex items-center text-gray-900">
                  <PiggyBank className="mr-1 inline size-3 text-green-700" />
                  <span className="numeric">{formatCurrency(budget)}</span>{" "}
                  limit
                </span>
              </>
            )}
          </div>
        </div>

        <Badge variant={spent > 0 ? "expense" : "muted"}>
          <span className="numeric">{formatCurrency(spent)}</span>
        </Badge>

        <RowActions
          label="Category actions"
          disabled={deleteMutation.isPending}
          onEdit={() => onEdit(category.id)}
          onDelete={handleDelete}
        />
      </li>
    </>
  );
};
