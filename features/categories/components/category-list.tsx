"use client";

import { Edit, MoreHorizontal, PiggyBank, Receipt, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";
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
};

export const CategoryList = ({
  categories,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
}: Props) => {
  const allSelected =
    categories.length > 0 && selected.length === categories.length;

  const deleteCategories = useBulkDeleteCategories();

  const [BulkConfirmDialog, confirmBulk] = useConfirm(
    "Are you sure?",
    `You are about to delete ${selected.length} categories.`
  );

  const onBulkDelete = async () => {
    const ok = await confirmBulk();
    if (!ok) return;

    deleteCategories.mutate(
      { ids: selected },
      { onSuccess: () => onToggleSelectAll(false) }
    );
  };

  return (
    <>
      <BulkConfirmDialog />

      <div className="border-alpha-300 flex items-center gap-x-3 border-b pb-2.5">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => onToggleSelectAll(!!value)}
          aria-label="Select all categories"
        />
        <p className="label-12 mr-auto font-medium text-gray-800">
          {selected.length > 0 ? `${selected.length} selected` : "Category"}
        </p>
        {selected.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={deleteCategories.isPending}
            onClick={onBulkDelete}
          >
            <Trash className="mr-1.5 size-4" />
            Delete ({selected.length})
          </Button>
        )}
      </div>

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="size-8 p-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={deleteMutation.isPending}
              onClick={() => onEdit(category.id)}
            >
              <Edit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
              className="text-red-900 focus:text-red-900"
            >
              <Trash className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </>
  );
};
