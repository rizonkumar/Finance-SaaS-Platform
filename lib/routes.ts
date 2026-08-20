import {
  ArrowLeftRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Shapes,
  Target,
} from "lucide-react";

export const NAV_ROUTES = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/debts", label: "Debts", icon: Landmark },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/categories", label: "Categories", icon: Shapes },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/goals": "Goals",
  "/debts": "Debts",
  "/recurring": "Recurring",
  "/accounts": "Accounts",
  "/categories": "Categories",
};

export const FILTERED_ROUTES: string[] = ["/", "/transactions", "/budgets"];
