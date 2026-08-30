"use client";

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Building2,
  CreditCard,
  Edit,
  HandCoins,
  Landmark,
  Lock,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Receipt,
  Trash,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteAccount } from "@/features/accounts/api/use-delete-account";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useConfirm } from "@/hooks/use-confirm";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { AccountType } from "@/lib/net-worth";
import { cn, convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

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

type Props = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  openingBalance?: number;
  transactionCount?: number;
  isSelected: boolean;
  onToggleSelect: (id: string, selected: boolean) => void;
  onEdit: (id: string) => void;
};

export const AccountCard = ({
  id,
  name,
  type,
  balance,
  openingBalance = 0,
  transactionCount = 0,
  isSelected,
  onToggleSelect,
  onEdit,
}: Props) => {
  const Icon = TYPE_ICON[type] ?? Landmark;
  const newTransaction = useNewTransaction();
  const deleteMutation = useDeleteAccount(id);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    `You are about to delete the "${name}" account.`
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate();
    }
  };

  const convertedBalance = convertAmountFromMiliunits(balance);
  const convertedOpening = convertAmountFromMiliunits(openingBalance);

  return (
    <>
      <ConfirmDialog />
      <Card
        className={cn(
          "transition-all hover:border-gray-500",
          isSelected && "border-blue-700 ring-1 ring-blue-700"
        )}
      >
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-2 pb-3">
          <div className="flex min-w-0 items-center gap-x-2.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelect(id, !!checked)}
              aria-label={`Select ${name}`}
            />
            <div
              className={cn(
                iconBox({
                  variant: convertedBalance < 0 ? "danger" : "default",
                }),
                "size-9"
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onEdit(id)}
                className="text-gray-1000 line-clamp-1 block text-left font-semibold hover:underline"
              >
                {name}
              </button>
              <p className="copy-13 line-clamp-1 text-gray-900">
                {ACCOUNT_TYPE_LABELS[type]}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0 p-0"
                aria-label="Account actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={deleteMutation.isPending}
                onClick={() => onEdit(id)}
              >
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                className="text-red-900 focus:text-red-900"
              >
                <Trash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div>
            <p className="copy-13 text-gray-900">Current Balance</p>
            <p
              className={cn(
                "numeric text-xl font-bold",
                convertedBalance < 0 ? "text-red-900" : "text-gray-1000"
              )}
            >
              {formatCurrency(convertedBalance)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={convertedBalance < 0 ? "expense" : "income"}>
              <span className="numeric">
                {formatCurrency(convertedBalance)}
              </span>
            </Badge>

            {transactionCount > 0 && (
              <Badge variant="muted">
                <Receipt className="size-3" />
                <span className="numeric">{transactionCount}</span>{" "}
                {transactionCount === 1 ? "txn" : "txns"}
              </Badge>
            )}

            {convertedOpening !== 0 && (
              <span className="copy-13 text-gray-700">
                Start:{" "}
                <span className="numeric">
                  {formatCurrency(convertedOpening)}
                </span>
              </span>
            )}
          </div>

          <div className="border-border flex items-center justify-between gap-x-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => newTransaction.onOpen({ accountId: id })}
            >
              <Plus />
              Add spend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onEdit(id)}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
