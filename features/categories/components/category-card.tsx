"use client";

import {
  Edit,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Receipt,
  Trash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useConfirm } from "@/hooks/use-confirm";
import { getCategoryMeta } from "@/lib/categories";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  transactionCount: number;
  totalExpenses: number;
  totalIncome: number;
  budgetAmount: number | null;
  isSelected: boolean;
  onToggleSelect: (id: string, selected: boolean) => void;
  onEdit: (id: string) => void;
};

export const CategoryCard = ({
  id,
  name,
  transactionCount,
  totalExpenses,
  budgetAmount,
  isSelected,
  onToggleSelect,
  onEdit,
}: Props) => {
  const meta = getCategoryMeta(name);
  const Icon = meta.icon;
  const newTransaction = useNewTransaction();
  const deleteMutation = useDeleteCategory(id);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    `You are about to delete the "${name}" category.`
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate();
    }
  };

  const spent = convertAmountFromMiliunits(totalExpenses);
  const budget =
    budgetAmount !== null ? convertAmountFromMiliunits(budgetAmount) : null;

  return (
    <>
      <ConfirmDialog />
      <Card
        className={cn(
          "transition-all hover:border-gray-500",
          isSelected && "border-blue-700 ring-1 ring-blue-700"
        )}
      >
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-2 pb-3">
          <div className="flex min-w-0 items-center gap-x-2.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelect(id, !!checked)}
              aria-label={`Select ${name}`}
            />
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-sm",
                meta.iconBgClass
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onEdit(id)}
                className="text-gray-1000 line-clamp-1 block text-left font-semibold hover:underline"
              >
                {name}
              </button>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0 p-0"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={deleteMutation.isPending}
                onClick={() => onEdit(id)}
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
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div>
            <p className="copy-13 text-gray-900">Total Spent</p>
            <p className="numeric text-gray-1000 text-xl font-bold">
              {formatCurrency(spent)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="muted">
              <Receipt className="mr-1 size-3" />
              <span className="numeric">{transactionCount}</span>{" "}
              {transactionCount === 1 ? "txn" : "txns"}
            </Badge>

            {budget !== null ? (
              <Badge variant="income">
                <PiggyBank className="mr-1 size-3" />
                <span className="numeric">{formatCurrency(budget)}</span> limit
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-700">
                No budget
              </Badge>
            )}
          </div>

          <div className="border-border flex items-center justify-between gap-x-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => newTransaction.onOpen({ categoryId: id })}
            >
              <Plus className="mr-1 size-3.5" />
              Add spend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onEdit(id)}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
