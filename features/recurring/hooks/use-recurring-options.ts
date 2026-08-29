import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetDebts } from "@/features/debts/api/use-get-debts";

export const useRecurringOptions = () => {
  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();
  const categoryQuery = useGetCategories();
  const categoryMutation = useCreateCategory();
  const debtQuery = useGetDebts();

  return {
    accountOptions: (accountQuery.data ?? []).map((account) => ({
      label: account.name,
      value: account.id,
    })),
    categoryOptions: (categoryQuery.data ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
    debtOptions: (debtQuery.data ?? []).map((debt) => ({
      label: debt.name,
      value: debt.id,
    })),
    onCreateAccount: (name: string) => accountMutation.mutate({ name }),
    onCreateCategory: (name: string) => categoryMutation.mutate({ name }),
    isLoading:
      accountQuery.isLoading || categoryQuery.isLoading || debtQuery.isLoading,
    isPending: accountMutation.isPending || categoryMutation.isPending,
  };
};
