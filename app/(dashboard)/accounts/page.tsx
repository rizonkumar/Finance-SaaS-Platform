"use client";

import { useMemo, useState } from "react";
import { CreditCard, Plus, Wallet } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { AccountCard } from "@/features/accounts/components/account-card";
import { AccountGlanceCards } from "@/features/accounts/components/account-glance-cards";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";
import { useConfirm } from "@/hooks/use-confirm";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { AccountType } from "@/lib/net-worth";
import { PAGE_META } from "@/lib/routes";
import { convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

import { AccountList } from "./account-list";

type SortOption =
  "balance-desc" | "balance-asc" | "name-asc" | "name-desc" | "type";

type AccountItem = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  openingBalance?: number;
  transactionCount?: number;
};

const EMPTY_ACCOUNTS: AccountItem[] = [];

const sortAccounts = (
  items: AccountItem[],
  sortBy: SortOption
): AccountItem[] => {
  return [...items].sort((a, b) => {
    if (sortBy === "balance-desc") return b.balance - a.balance;
    if (sortBy === "balance-asc") return a.balance - b.balance;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "type") return a.type.localeCompare(b.type);
    return 0;
  });
};

const AccountsPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("balance-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<string[]>([]);

  const newAccount = useNewAccount();
  const openAccount = useOpenAccount();
  const deleteAccounts = useBulkDeleteAccounts();
  const accountsQuery = useGetAccounts();

  const [BulkConfirmDialog, confirmBulk] = useConfirm(
    "Are you sure?",
    `You are about to delete ${selected.length} accounts.`
  );

  const rawAccounts = accountsQuery.data;
  const accounts = useMemo(
    () => (rawAccounts as AccountItem[]) ?? EMPTY_ACCOUNTS,
    [rawAccounts]
  );

  const filteredAccounts = useMemo(() => {
    const query = search.toLowerCase().trim();
    const matched = accounts.filter((account) => {
      const matchesSearch = account.name.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || account.type === typeFilter;
      return matchesSearch && matchesType;
    });

    return sortAccounts(matched, sortBy);
  }, [accounts, search, typeFilter, sortBy]);

  const toggleSelectOne = (id: string, isChecked: boolean) => {
    setSelected((prev) =>
      isChecked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const toggleSelectAll = (isChecked: boolean) => {
    setSelected(isChecked ? filteredAccounts.map((a) => a.id) : []);
  };

  const onBulkDelete = async () => {
    const ok = await confirmBulk();
    if (!ok) return;

    deleteAccounts.mutate(
      { ids: selected },
      { onSuccess: () => setSelected([]) }
    );
  };

  const netBalanceMiliunits = accounts.reduce((sum, a) => sum + a.balance, 0);
  const netBalance = convertAmountFromMiliunits(netBalanceMiliunits);

  const chips =
    accounts.length > 0
      ? [
          {
            label: `${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`,
            icon: CreditCard,
          },
          {
            label: `${formatCurrency(netBalance)} net`,
            icon: Wallet,
          },
        ]
      : undefined;

  const renderContent = () => {
    if (accountsQuery.isLoading)
      return <CardGridSkeleton count={8} columns={4} />;

    if (accountsQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => accountsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    if (accounts.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={CreditCard}
              title="No accounts yet"
              description="Add a bank account, card or wallet to start tracking transactions against it."
              actionLabel="Add account"
              onAction={newAccount.onOpen}
            />
          </CardContent>
        </Card>
      );
    }

    if (filteredAccounts.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={CreditCard}
              title="No accounts found"
              description={`No accounts matched "${search}". Try adjusting your filters.`}
              actionLabel="Clear filters"
              onAction={() => {
                setSearch("");
                setTypeFilter("all");
              }}
            />
          </CardContent>
        </Card>
      );
    }

    if (viewMode === "list") {
      return (
        <Card>
          <CardContent className="pt-5">
            <AccountList
              accounts={filteredAccounts}
              selected={selected}
              onToggleSelect={toggleSelectOne}
              onToggleSelectAll={toggleSelectAll}
              onBulkDelete={onBulkDelete}
              isDeleting={deleteAccounts.isPending}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <BulkSelectionBar
          selectedCount={selected.length}
          totalCount={filteredAccounts.length}
          itemLabel={`${filteredAccounts.length} ${filteredAccounts.length === 1 ? "account" : "accounts"}`}
          onToggleSelectAll={toggleSelectAll}
          onDelete={onBulkDelete}
          disabled={deleteAccounts.isPending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              id={account.id}
              name={account.name}
              type={account.type}
              balance={account.balance}
              openingBalance={account.openingBalance}
              transactionCount={account.transactionCount}
              isSelected={selected.includes(account.id)}
              onToggleSelect={toggleSelectOne}
              onEdit={openAccount.onOpen}
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
        title={PAGE_META["/accounts"].title}
        description={PAGE_META["/accounts"].description}
        chips={chips}
        actions={
          <Button onClick={newAccount.onOpen} size="sm" className="md:hidden">
            <Plus />
            Add account
          </Button>
        }
      />

      {accounts.length > 0 && <AccountGlanceCards accounts={accounts} />}

      {accounts.length > 0 && (
        <CollectionToolbar viewMode={viewMode} onViewModeChange={setViewMode}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search accounts..."
            className="w-full sm:w-64"
          />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={TOOLBAR_SELECT}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as SortOption)}
          >
            <SelectTrigger className={TOOLBAR_SELECT}>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance-desc">Highest Balance</SelectItem>
              <SelectItem value="balance-asc">Lowest Balance</SelectItem>
              <SelectItem value="name-asc">Name (A → Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z → A)</SelectItem>
              <SelectItem value="type">Account Type</SelectItem>
            </SelectContent>
          </Select>
        </CollectionToolbar>
      )}

      {renderContent()}
    </div>
  );
};

export default AccountsPage;
