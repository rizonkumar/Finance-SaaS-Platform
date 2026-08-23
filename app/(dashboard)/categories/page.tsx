"use client";

import { useMemo, useState } from "react";
import {
  Grid,
  List,
  PiggyBank,
  Shapes,
  Trash,
  TrendingDown,
} from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { CategoryCard } from "@/features/categories/components/category-card";
import { CategoryGlanceCards } from "@/features/categories/components/category-glance-cards";
import { CategoryList } from "@/features/categories/components/category-list";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { useConfirm } from "@/hooks/use-confirm";
import { PAGE_META } from "@/lib/routes";
import { convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

type SortOption = "name-asc" | "name-desc" | "spent-desc" | "txns-desc";

type CategoryItem = {
  id: string;
  name: string;
  transactionCount: number;
  totalExpenses: number;
  totalIncome: number;
  budgetAmount: number | null;
};

const EMPTY_CATEGORIES: CategoryItem[] = [];

const sortCategories = (
  items: CategoryItem[],
  sortBy: SortOption
): CategoryItem[] => {
  return [...items].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "spent-desc") return b.totalExpenses - a.totalExpenses;
    if (sortBy === "txns-desc") return b.transactionCount - a.transactionCount;
    return 0;
  });
};

const CategoriesPage = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);

  const newCategory = useNewCategory();
  const openCategory = useOpenCategory();
  const deleteCategories = useBulkDeleteCategories();
  const categoriesQuery = useGetCategories();

  const [BulkConfirmDialog, confirmBulk] = useConfirm(
    "Are you sure?",
    `You are about to delete ${selected.length} categories.`
  );

  const rawData = categoriesQuery.data;
  const categories = useMemo(() => rawData ?? EMPTY_CATEGORIES, [rawData]);

  const filteredCategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    const matched = categories.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
    return sortCategories(matched, sortBy);
  }, [categories, search, sortBy]);

  const toggleSelectOne = (id: string, isChecked: boolean) => {
    setSelected((prev) =>
      isChecked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const toggleSelectAll = (isChecked: boolean) => {
    setSelected(isChecked ? filteredCategories.map((c) => c.id) : []);
  };

  const onBulkDelete = async () => {
    const ok = await confirmBulk();
    if (!ok) return;

    deleteCategories.mutate(
      { ids: selected },
      { onSuccess: () => setSelected([]) }
    );
  };

  if (categoriesQuery.isLoading) {
    return <CardGridSkeleton count={8} />;
  }

  const totalSpentMiliunits = categories.reduce(
    (sum, cat) => sum + cat.totalExpenses,
    0
  );
  const totalSpent = convertAmountFromMiliunits(totalSpentMiliunits);

  const budgetedCount = categories.filter(
    (cat) => cat.budgetAmount !== null && cat.budgetAmount > 0
  ).length;

  const chips =
    categories.length > 0
      ? [
          {
            label: `${categories.length} ${categories.length === 1 ? "category" : "categories"}`,
            icon: Shapes,
          },
          ...(totalSpent > 0
            ? [
                {
                  label: `${formatCurrency(totalSpent)} spent`,
                  icon: TrendingDown,
                },
              ]
            : []),
          ...(budgetedCount > 0
            ? [
                {
                  label: `${budgetedCount} with limits`,
                  icon: PiggyBank,
                },
              ]
            : []),
        ]
      : undefined;

  const renderContent = () => {
    if (categories.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Shapes}
              title="No categories yet"
              description="Group your spending into categories to see where the money actually goes."
              actionLabel="Add Category"
              onAction={newCategory.onOpen}
            />
          </CardContent>
        </Card>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Shapes}
              title="No categories found"
              description={`No categories matched "${search}". Try searching for another name.`}
              actionLabel="Clear Search"
              onAction={() => setSearch("")}
            />
          </CardContent>
        </Card>
      );
    }

    if (viewMode === "list") {
      return (
        <Card>
          <CardContent className="pt-5">
            <CategoryList
              categories={filteredCategories}
              selected={selected}
              onToggleSelect={toggleSelectOne}
              onToggleSelectAll={toggleSelectAll}
              onEdit={openCategory.onOpen}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {selected.length > 0 && (
          <div className="border-border flex items-center justify-between rounded-md border bg-gray-100 p-2.5 px-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  filteredCategories.length > 0 &&
                  selected.length === filteredCategories.length
                }
                onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                aria-label="Select all"
              />
              <span className="copy-13 text-gray-1000 font-medium">
                {selected.length} of {filteredCategories.length} selected
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={deleteCategories.isPending}
              onClick={onBulkDelete}
            >
              <Trash className="mr-1 size-3.5" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              transactionCount={cat.transactionCount}
              totalExpenses={cat.totalExpenses}
              totalIncome={cat.totalIncome}
              budgetAmount={cat.budgetAmount}
              isSelected={selected.includes(cat.id)}
              onToggleSelect={toggleSelectOne}
              onEdit={openCategory.onOpen}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <BulkConfirmDialog />

      <PageHeader
        title={PAGE_META["/categories"].title}
        description={PAGE_META["/categories"].description}
        chips={chips}
      />

      {categories.length > 0 && <CategoryGlanceCards categories={categories} />}

      {categories.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search categories..."
              className="w-full sm:w-64"
            />

            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortOption)}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                <SelectItem value="spent-desc">Highest Spend</SelectItem>
                <SelectItem value="txns-desc">Most Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="border-border flex items-center rounded-md border p-0.5">
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                className="size-7"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid className="size-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                className="size-7"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default CategoriesPage;
