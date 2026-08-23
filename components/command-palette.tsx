"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Monitor, Moon, Plus, Sun } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useNewBudget } from "@/features/budgets/hooks/use-new-budget";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { useNewDebt } from "@/features/debts/hooks/use-new-debt";
import { useNewGoal } from "@/features/goals/hooks/use-new-goal";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useNewTransfer } from "@/features/transfers/hooks/use-new-transfer";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { NAV_SECTIONS } from "@/lib/routes";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export const CommandPalette = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isOpen, onOpen, onClose } = useCommandPalette();

  const newTransaction = useNewTransaction();
  const newTransfer = useNewTransfer();
  const newBudget = useNewBudget();
  const newGoal = useNewGoal();
  const newDebt = useNewDebt();
  const newRecurring = useNewRecurring();
  const newAccount = useNewAccount();
  const newCategory = useNewCategory();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;

      event.preventDefault();
      if (isOpen) onClose();
      else onOpen();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onOpen, onClose]);

  // Sheets are mounted globally by SheetProvider, so every create action works
  // regardless of which route the palette was opened from.
  const CREATE_ACTIONS = [
    { label: "New transaction", run: newTransaction.onOpen },
    { label: "New transfer", run: newTransfer.onOpen },
    { label: "New budget", run: newBudget.onOpen },
    { label: "New goal", run: newGoal.onOpen },
    { label: "New debt", run: newDebt.onOpen },
    { label: "New recurring schedule", run: newRecurring.onOpen },
    { label: "New account", run: newAccount.onOpen },
    { label: "New category", run: newCategory.onOpen },
  ];

  const select = (run: () => void) => {
    onClose();
    run();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose} label="Command palette">
      <CommandInput placeholder="Jump to a page, or create something..." />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Go to">
          {NAV_SECTIONS.flatMap((section) => section.items).map(
            ({ href, label, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`go ${label}`}
                onSelect={() => select(() => router.push(href))}
              >
                <Icon />
                {label}
              </CommandItem>
            )
          )}
        </CommandGroup>

        <CommandGroup heading="Create">
          {CREATE_ACTIONS.map(({ label, run }) => (
            <CommandItem key={label} value={label} onSelect={() => select(run)}>
              <Plus />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Theme">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <CommandItem
              key={value}
              value={`theme ${label}`}
              onSelect={() => select(() => setTheme(value))}
            >
              <Icon />
              {label}
              <CommandShortcut>theme</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
