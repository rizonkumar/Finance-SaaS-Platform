"use client";

import { Shapes } from "lucide-react";

import { ResourcePage } from "@/components/resource-page";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { PAGE_META } from "@/lib/routes";

import { columns } from "./columns";

const CategoriesPage = () => {
  const newCategory = useNewCategory();
  const deleteCategories = useBulkDeleteCategories();
  const categoriesQuery = useGetCategories();

  const categories = categoriesQuery.data ?? [];

  return (
    <ResourcePage
      title={PAGE_META["/categories"].title}
      description={PAGE_META["/categories"].description}
      chips={
        categories.length > 0
          ? [{ label: `${categories.length} categories`, icon: Shapes }]
          : undefined
      }
      createLabel="Add Category"
      filterKey="name"
      columns={columns}
      data={categories}
      isLoading={categoriesQuery.isLoading}
      disabled={categoriesQuery.isLoading || deleteCategories.isPending}
      onCreate={newCategory.onOpen}
      onDelete={(ids) => deleteCategories.mutate({ ids })}
      emptyIcon={Shapes}
      emptyTitle="No categories yet"
      emptyDescription="Group your spending into categories to see where the money actually goes."
    />
  );
};

export default CategoriesPage;
