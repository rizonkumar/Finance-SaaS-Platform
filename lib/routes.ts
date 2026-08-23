import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  LineChart,
  CreditCard,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Shapes,
  Target,
  TrendingUp,
} from "lucide-react";

type NavRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string | null;
  items: readonly NavRoute[];
};

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: null,
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/forecast", label: "Forecast", icon: TrendingUp },
      { href: "/portfolio", label: "Portfolio", icon: LineChart },
      { href: "/budgets", label: "Budgets", icon: PiggyBank },
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/debts", label: "Debts", icon: Landmark },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/accounts", label: "Accounts", icon: CreditCard },
      { href: "/categories", label: "Categories", icon: Shapes },
    ],
  },
];

export const PAGE_META = {
  "/": {
    title: "Overview",
    description:
      "Where your money stands right now, and what changed over the period.",
  },
  "/transactions": {
    title: "Transactions",
    description: "Every inflow and outflow, with CSV import and bulk editing.",
  },
  "/forecast": {
    title: "Forecast",
    description:
      "Your projected balance, built from scheduled income and expenses.",
  },
  "/portfolio": {
    title: "Portfolio",
    description:
      "Stocks and funds you hold, what they cost and what they are worth now.",
  },
  "/budgets": {
    title: "Budgets",
    description:
      "Spending limits per category, and how much of each you have used.",
  },
  "/goals": {
    title: "Goals",
    description: "What you are saving toward, and whether you are on pace.",
  },
  "/debts": {
    title: "Debts",
    description:
      "What you owe, what you have cleared, and how fast it is shrinking.",
  },
  "/recurring": {
    title: "Recurring",
    description:
      "Rent, salary and subscriptions, entered for you on a schedule.",
  },
  "/accounts": {
    title: "Accounts",
    description: "The accounts your transactions are attributed to.",
  },
  "/categories": {
    title: "Categories",
    description: "Labels used to group spending across budgets and reports.",
  },
} as const;

export const pageMeta = (pathname: string) =>
  PAGE_META[pathname as keyof typeof PAGE_META] as
    { title: string; description: string } | undefined;
