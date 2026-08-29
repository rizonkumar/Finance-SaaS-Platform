"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Building2,
  CreditCard,
  HandCoins,
  Landmark,
  Lock,
  PiggyBank,
  Receipt,
  Trash,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";
import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";
import { useConfirm } from "@/hooks/use-confirm";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { AccountType } from "@/lib/net-worth";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

import { Actions } from "./actions";

const TYPE_ICON: Record<AccountType, LucideIcon> = {
  savings: Landmark,
  cash: Banknote,
  wallet: Wallet,
  investment: TrendingUp,
  fixed_deposit: Lock,
  ppf: PiggyBank,
  epf: Building2,
  credit: CreditCard,
  loan: HandCoins,
};

type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  openingBalance?: number;
  transactionCount?: number;
};

type Props = {
  accounts: Account[];
  selected?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
};

export const AccountList = ({
  accounts,
  selected: externalSelected,
  onToggleSelect: externalToggleSelect,
  onToggleSelectAll: externalToggleSelectAll,
}: Props) => {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const deleteAccounts = useBulkDeleteAccounts();
  const openAccount = useOpenAccount();

  const selected = externalSelected ?? internalSelected;

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    `You are about to delete ${selected.length} accounts.`
  );

  const allSelected =
    accounts.length > 0 && selected.length === accounts.length;

  const toggleAll = (checked: boolean) => {
    if (externalToggleSelectAll) {
      externalToggleSelectAll(checked);
    } else {
      setInternalSelected(checked ? accounts.map((account) => account.id) : []);
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    if (externalToggleSelect) {
      externalToggleSelect(id, checked);
    } else {
      setInternalSelected((current) =>
        checked ? [...current, id] : current.filter((value) => value !== id)
      );
    }
  };

  const onBulkDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deleteAccounts.mutate(
      { ids: selected },
      { onSuccess: () => toggleAll(false) }
    );
  };

  return (
    <>
      <ConfirmDialog />

      <div className="border-alpha-300 flex items-center gap-x-3 border-b pb-2.5">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => toggleAll(!!value)}
          aria-label="Select all accounts"
        />
        <p className="label-12 mr-auto font-medium text-gray-800">
          {selected.length > 0 ? `${selected.length} selected` : "Account"}
        </p>
        {selected.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={deleteAccounts.isPending}
            onClick={onBulkDelete}
          >
            <Trash className="mr-1.5 size-4" />
            Delete ({selected.length})
          </Button>
        )}
      </div>

      <ul className="divide-border divide-y">
        {accounts.map((account) => {
          const Icon = TYPE_ICON[account.type] ?? Landmark;
          const balance = convertAmountFromMiliunits(account.balance);

          return (
            <li key={account.id} className="flex items-center gap-x-3 py-3">
              <Checkbox
                checked={selected.includes(account.id)}
                onCheckedChange={(value) => toggleOne(account.id, !!value)}
                aria-label={`Select ${account.name}`}
              />

              <div
                className={cn(
                  iconBox({ variant: balance < 0 ? "danger" : "default" }),
                  "size-9"
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => openAccount.onOpen(account.id)}
                  className="copy-14 text-gray-1000 line-clamp-1 text-left font-medium hover:underline"
                >
                  {account.name}
                </button>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="copy-13 text-gray-900">
                    {ACCOUNT_TYPE_LABELS[account.type]}
                  </span>
                  {account.transactionCount !== undefined &&
                    account.transactionCount > 0 && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="copy-13 flex items-center text-gray-700">
                          <Receipt className="mr-1 inline size-3" />
                          <span className="numeric">
                            {account.transactionCount}
                          </span>{" "}
                          {account.transactionCount === 1 ? "txn" : "txns"}
                        </span>
                      </>
                    )}
                </div>
              </div>

              <Badge variant={balance < 0 ? "expense" : "income"}>
                <span className="numeric">{formatCurrency(balance)}</span>
              </Badge>

              <Actions id={account.id} />
            </li>
          );
        })}
      </ul>
    </>
  );
};
