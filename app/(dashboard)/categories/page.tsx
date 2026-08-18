"use client";

import { Shapes } from "lucide-react";

import { ResourcePage } from "@/components/resource-page";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";

import { columns } from "./columns";

const CategoriesPage = () => {
  const newCategory = useNewCategory();
  const deleteCategories = useBulkDeleteCategories();
  const categoriesQuery = useGetCategories();

  return (
    <ResourcePage
      title="Categories"
      createLabel="Add Category"
      filterKey="name"
      columns={columns}
      data={categoriesQuery.data ?? []}
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
