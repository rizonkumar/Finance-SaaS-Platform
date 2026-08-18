"use client";

import { CreditCard } from "lucide-react";

import { ResourcePage } from "@/components/resource-page";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

import { columns } from "./columns";

const AccountsPage = () => {
  const newAccount = useNewAccount();
  const deleteAccounts = useBulkDeleteAccounts();
  const accountsQuery = useGetAccounts();

  return (
    <ResourcePage
      title="Accounts"
      createLabel="Add Account"
      filterKey="name"
      columns={columns}
      data={accountsQuery.data ?? []}
      isLoading={accountsQuery.isLoading}
      disabled={accountsQuery.isLoading || deleteAccounts.isPending}
      onCreate={newAccount.onOpen}
      onDelete={(ids) => deleteAccounts.mutate({ ids })}
      emptyIcon={CreditCard}
      emptyTitle="No accounts yet"
      emptyDescription="Add a bank account, card or wallet to start tracking transactions against it."
    />
  );
};

export default AccountsPage;
