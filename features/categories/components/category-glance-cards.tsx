"use client";

import { PiggyBank, Shapes, TrendingDown, TrendingUp } from "lucide-react";

import { DATA_CARD_HEIGHT, iconBox } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { Card } from "@/components/ui/card";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

type CategoryData = {
  id: string;
  name: string;
  transactionCount: number;
  totalExpenses: number;
  totalIncome: number;
  budgetAmount: number | null;
};

type Props = {
  categories: CategoryData[];
};

export const CategoryGlanceCards = ({ categories }: Props) => {
  const totalCategories = categories.length;

  const totalSpentMiliunits = categories.reduce(
    (sum, cat) => sum + cat.totalExpenses,
    0
  );
  const totalSpent = convertAmountFromMiliunits(totalSpentMiliunits);

  const topCategory =
    categories.length > 0
      ? [...categories].sort((a, b) => b.totalExpenses - a.totalExpenses)[0]
      : null;

  const budgetedCount = categories.filter(
    (cat) => cat.budgetAmount !== null && cat.budgetAmount > 0
  ).length;

  return (
    <StatGroup columns={4}>
      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">
            Total Categories
          </p>
          <div className={cn(iconBox({ variant: "default" }), "size-7")}>
            <Shapes className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {totalCategories}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          {totalCategories === 1
            ? "1 active label"
            : `${totalCategories} active labels`}
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">Total Spending</p>
          <div className={cn(iconBox({ variant: "danger" }), "size-7")}>
            <TrendingDown className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {formatCurrency(totalSpent)}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          Across all categorized transactions
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">Top Category</p>
          <div className={cn(iconBox({ variant: "warning" }), "size-7")}>
            <TrendingUp className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 truncate">
          {topCategory && topCategory.totalExpenses > 0
            ? topCategory.name
            : "None"}
        </p>
        <p className="copy-13 truncate text-gray-900">
          {topCategory && topCategory.totalExpenses > 0
            ? `${formatCurrency(convertAmountFromMiliunits(topCategory.totalExpenses))} spent`
            : "No expenses recorded"}
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">Budget Coverage</p>
          <div className={cn(iconBox({ variant: "success" }), "size-7")}>
            <PiggyBank className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {budgetedCount} / {totalCategories}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          {totalCategories > 0
            ? `${Math.round((budgetedCount / totalCategories) * 100)}% with limits`
            : "No categories set"}
        </p>
      </Card>
    </StatGroup>
  );
};
