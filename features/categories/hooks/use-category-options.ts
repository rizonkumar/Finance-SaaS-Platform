import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetCategories } from "@/features/categories/api/use-get-categories";

export const useCategoryOptions = () => {
  const categoriesQuery = useGetCategories();
  const createCategory = useCreateCategory();

  return {
    options: (categoriesQuery.data ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
    isLoading: categoriesQuery.isLoading,
    isCreating: createCategory.isPending,
    onCreate: (name: string) => createCategory.mutate({ name }),
  };
};
