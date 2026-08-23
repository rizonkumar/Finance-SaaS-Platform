"use client";

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { AccountType } from "@/lib/net-worth";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

import { Actions } from "./actions";

const TYPE_ICON: Record<AccountType, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  cash: Wallet,
  investment: TrendingUp,
  credit: CreditCard,
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

export const AccountList = ({ accounts }: Props) => (
  <ul className="divide-border divide-y">
    {accounts.map((account) => {
      const Icon = TYPE_ICON[account.type];
      const balance = convertAmountFromMiliunits(account.balance);

      return (
        <li
          key={account.id}
          className="flex items-center gap-x-3 py-3 first:pt-0 last:pb-0"
        >
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
);
