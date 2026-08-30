"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Shapes, TrendingDown } from "lucide-react";

import { BulkSelectionBar } from "@/components/bulk-selection-bar";
import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import {
  CollectionToolbar,
  TOOLBAR_SELECT,
} from "@/components/collection-toolbar";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { type ViewMode } from "@/components/view-toggle";
import { Card, CardContent } from "@/components/ui/card";
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
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
    if (categoriesQuery.isLoading)
      return <CardGridSkeleton count={8} columns={4} />;

    if (categoriesQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => categoriesQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    if (categories.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Shapes}
              title="No categories yet"
              description="Group your spending into categories to see where the money actually goes."
              actionLabel="Add category"
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
              actionLabel="Clear search"
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
              onBulkDelete={onBulkDelete}
              isDeleting={deleteCategories.isPending}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <BulkSelectionBar
          selectedCount={selected.length}
          totalCount={filteredCategories.length}
          itemLabel={`${filteredCategories.length} ${filteredCategories.length === 1 ? "category" : "categories"}`}
          onToggleSelectAll={toggleSelectAll}
          onDelete={onBulkDelete}
          disabled={deleteCategories.isPending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <CollectionToolbar viewMode={viewMode} onViewModeChange={setViewMode}>
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
            <SelectTrigger className={TOOLBAR_SELECT}>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A → Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z → A)</SelectItem>
              <SelectItem value="spent-desc">Highest Spend</SelectItem>
              <SelectItem value="txns-desc">Most Transactions</SelectItem>
            </SelectContent>
          </Select>
        </CollectionToolbar>
      )}

      {renderContent()}
    </div>
  );
};

export default CategoriesPage;
