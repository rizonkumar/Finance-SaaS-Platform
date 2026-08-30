"use client";

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
  TrendingUp,
  Wallet,
} from "lucide-react";

import { BulkSelectionBar } from "@/components/bulk-selection-bar";
import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";
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
  selected: string[];
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onBulkDelete: () => void;
  isDeleting: boolean;
};

export const AccountList = ({
  accounts,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
  isDeleting,
}: Props) => {
  const openAccount = useOpenAccount();

  return (
    <>
      <BulkSelectionBar
        selectedCount={selected.length}
        totalCount={accounts.length}
        itemLabel={`${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
        onToggleSelectAll={onToggleSelectAll}
        onDelete={onBulkDelete}
        disabled={isDeleting}
        bordered={false}
      />

      <ul className="divide-border divide-y">
        {accounts.map((account) => {
          const Icon = TYPE_ICON[account.type] ?? Landmark;
          const balance = convertAmountFromMiliunits(account.balance);

          return (
            <li key={account.id} className="flex items-center gap-x-3 py-3">
              <Checkbox
                checked={selected.includes(account.id)}
                onCheckedChange={(value) => onToggleSelect(account.id, !!value)}
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
                        <span className="copy-13 flex items-center text-gray-900">
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
