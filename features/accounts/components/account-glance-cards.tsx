"use client";

import { Building2, CreditCard, Landmark, Wallet } from "lucide-react";

import { DATA_CARD_HEIGHT, iconBox } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { Card } from "@/components/ui/card";
import type { AccountType } from "@/lib/net-worth";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

type AccountData = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
};

type Props = {
  accounts: AccountData[];
};

export const AccountGlanceCards = ({ accounts }: Props) => {
  const totalAccounts = accounts.length;

  let totalAssetsMiliunits = 0;
  let totalLiabilitiesMiliunits = 0;

  for (const account of accounts) {
    if (account.balance >= 0) {
      totalAssetsMiliunits += account.balance;
    } else {
      totalLiabilitiesMiliunits += Math.abs(account.balance);
    }
  }

  const assets = convertAmountFromMiliunits(totalAssetsMiliunits);
  const liabilities = convertAmountFromMiliunits(totalLiabilitiesMiliunits);
  const net = assets - liabilities;

  return (
    <StatGroup columns={4}>
      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">Total Assets</p>
          <div className={cn(iconBox({ variant: "success" }), "size-7")}>
            <Landmark className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {formatCurrency(assets)}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          Positive balances & cash
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">
            Total Liabilities
          </p>
          <div className={cn(iconBox({ variant: "danger" }), "size-7")}>
            <CreditCard className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {formatCurrency(liabilities)}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          Credit cards & loans
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">
            Net Account Balance
          </p>
          <div
            className={cn(
              iconBox({ variant: net < 0 ? "danger" : "default" }),
              "size-7"
            )}
          >
            <Wallet className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {formatCurrency(net)}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          Assets minus liabilities
        </p>
      </Card>

      <Card
        className="flex flex-col justify-between gap-y-3 p-4"
        style={{ height: DATA_CARD_HEIGHT }}
      >
        <div className="flex items-start justify-between gap-x-2">
          <p className="label-13 line-clamp-1 text-gray-900">Total Accounts</p>
          <div className={cn(iconBox({ variant: "default" }), "size-7")}>
            <Building2 className="size-3.5" />
          </div>
        </div>
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          {totalAccounts}
        </p>
        <p className="copy-13 line-clamp-1 text-gray-900">
          {totalAccounts === 1
            ? "1 connected account"
            : `${totalAccounts} connected accounts`}
        </p>
      </Card>
    </StatGroup>
  );
};
