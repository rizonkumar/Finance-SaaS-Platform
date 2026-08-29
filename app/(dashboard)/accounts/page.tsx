"use client";

import { CreditCard, Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { PAGE_META } from "@/lib/routes";

import { AccountList } from "./account-list";

const AccountsPage = () => {
  const newAccount = useNewAccount();
  const accountsQuery = useGetAccounts();

  if (accountsQuery.isLoading) return <TablePageSkeleton />;

  if (accountsQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => accountsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const accounts = accountsQuery.data ?? [];

  return (
    <>
      <PageHeader
        title={PAGE_META["/accounts"].title}
        description={PAGE_META["/accounts"].description}
        chips={
          accounts.length > 0
            ? [
                {
                  label: `${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`,
                  icon: CreditCard,
                },
              ]
            : undefined
        }
        actions={
          <Button onClick={newAccount.onOpen} size="sm">
            <Plus className="size-4" />
            Add Account
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-5">
          {accounts.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No accounts yet"
              description="Add a bank account, card or wallet to start tracking transactions against it."
              actionLabel="Add Account"
              onAction={newAccount.onOpen}
            />
          ) : (
            <AccountList accounts={accounts} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AccountsPage;
