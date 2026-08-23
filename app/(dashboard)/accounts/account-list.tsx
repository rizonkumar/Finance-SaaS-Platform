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
  Trash,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";
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
};

type Props = {
  accounts: Account[];
};

export const AccountList = ({ accounts }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const deleteAccounts = useBulkDeleteAccounts();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete the selected accounts."
  );

  const allSelected =
    accounts.length > 0 && selected.length === accounts.length;

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? accounts.map((account) => account.id) : []);

  const toggleOne = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id)
    );

  const onBulkDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deleteAccounts.mutate(
      { ids: selected },
      { onSuccess: () => setSelected([]) }
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
            <Trash className="size-4" />
            Delete ({selected.length})
          </Button>
        )}
      </div>

      <ul className="divide-border divide-y">
        {accounts.map((account) => {
          const Icon = TYPE_ICON[account.type];
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
                <p className="copy-14 text-gray-1000 line-clamp-1 font-medium">
                  {account.name}
                </p>
                <p className="copy-13 text-gray-900">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </p>
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
