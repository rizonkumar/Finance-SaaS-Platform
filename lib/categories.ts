import type { LucideIcon } from "lucide-react";
import {
  Car,
  Film,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  Plane,
  Repeat,
  Shapes,
  Shield,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
} from "lucide-react";

export type CategoryMeta = {
  icon: LucideIcon;
  badgeClass: string;
  iconBgClass: string;
};

const AMBER_STYLE = {
  badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  iconBgClass: "bg-amber-100 text-amber-900",
};

const BLUE_STYLE = {
  badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
  iconBgClass: "bg-blue-100 text-blue-900",
};

const PURPLE_STYLE = {
  badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
  iconBgClass: "bg-purple-100 text-purple-900",
};

const TEAL_STYLE = {
  badgeClass: "bg-teal-100 text-teal-900 border-teal-300",
  iconBgClass: "bg-teal-100 text-teal-900",
};

const PINK_STYLE = {
  badgeClass: "bg-pink-100 text-pink-900 border-pink-300",
  iconBgClass: "bg-pink-100 text-pink-900",
};

const RED_STYLE = {
  badgeClass: "bg-red-100 text-red-900 border-red-300",
  iconBgClass: "bg-red-100 text-red-900",
};

const GREEN_STYLE = {
  badgeClass: "bg-green-100 text-green-900 border-green-300",
  iconBgClass: "bg-green-100 text-green-900",
};

const DEFAULT_META: CategoryMeta = {
  icon: Shapes,
  badgeClass: "bg-gray-100 text-gray-900 border-gray-300",
  iconBgClass: "bg-gray-100 text-gray-900",
};

const CATEGORY_MAP: {
  keywords: string[];
  icon: LucideIcon;
  badgeClass: string;
  iconBgClass: string;
}[] = [
  {
    keywords: [
      "food",
      "dining",
      "restaurant",
      "groceries",
      "grocery",
      "coffee",
      "drinks",
      "snack",
      "meal",
      "cafe",
      "lunch",
      "dinner",
      "breakfast",
    ],
    icon: Utensils,
    ...AMBER_STYLE,
  },
  {
    keywords: [
      "travel",
      "flight",
      "hotel",
      "trip",
      "vacation",
      "airline",
      "airport",
      "tour",
    ],
    icon: Plane,
    ...BLUE_STYLE,
  },
  {
    keywords: [
      "movie",
      "cinema",
      "entertainment",
      "game",
      "gaming",
      "theater",
      "theatre",
      "show",
      "netflix",
      "spotify",
      "music",
    ],
    icon: Film,
    ...PURPLE_STYLE,
  },
  {
    keywords: [
      "wifi",
      "internet",
      "utility",
      "utilities",
      "electric",
      "electricity",
      "water",
      "gas",
      "bill",
      "power",
      "broadband",
      "phone",
      "mobile",
    ],
    icon: Wifi,
    ...TEAL_STYLE,
  },
  {
    keywords: [
      "subscription",
      "subscriptions",
      "saas",
      "software",
      "recurring",
      "membership",
      "cloud",
      "app",
    ],
    icon: Repeat,
    ...BLUE_STYLE,
  },
  {
    keywords: [
      "shopping",
      "clothes",
      "clothing",
      "fashion",
      "store",
      "retail",
      "amazon",
      "electronics",
      "gadget",
      "shoes",
    ],
    icon: ShoppingBag,
    ...PINK_STYLE,
  },
  {
    keywords: [
      "health",
      "medical",
      "doctor",
      "medicine",
      "pharmacy",
      "hospital",
      "fitness",
      "gym",
      "workout",
      "dental",
      "clinic",
    ],
    icon: HeartPulse,
    ...RED_STYLE,
  },
  {
    keywords: [
      "home",
      "housing",
      "rent",
      "mortgage",
      "apartment",
      "property",
      "furniture",
      "repair",
      "maintenance",
    ],
    icon: Home,
    ...BLUE_STYLE,
  },
  {
    keywords: [
      "education",
      "school",
      "college",
      "university",
      "course",
      "books",
      "tuition",
      "learning",
      "study",
    ],
    icon: GraduationCap,
    ...GREEN_STYLE,
  },
  {
    keywords: [
      "salary",
      "income",
      "wage",
      "paycheck",
      "freelance",
      "bonus",
      "dividend",
      "interest",
      "earning",
      "earnings",
    ],
    icon: Wallet,
    ...GREEN_STYLE,
  },
  {
    keywords: [
      "investment",
      "investing",
      "stock",
      "stocks",
      "crypto",
      "mutual fund",
      "trading",
      "equity",
    ],
    icon: TrendingUp,
    ...GREEN_STYLE,
  },
  {
    keywords: ["debt", "loan", "emi", "credit card", "mortgage", "borrow"],
    icon: Landmark,
    ...RED_STYLE,
  },
  {
    keywords: ["savings", "save", "deposit", "emergency fund"],
    icon: PiggyBank,
    ...TEAL_STYLE,
  },
  {
    keywords: [
      "transport",
      "car",
      "fuel",
      "gasoline",
      "cab",
      "uber",
      "taxi",
      "parking",
      "auto",
    ],
    icon: Car,
    ...AMBER_STYLE,
  },
  {
    keywords: [
      "insurance",
      "life insurance",
      "health insurance",
      "vehicle insurance",
    ],
    icon: Shield,
    ...BLUE_STYLE,
  },
  {
    keywords: ["gift", "charity", "donation", "present", "ngo"],
    icon: Gift,
    ...PINK_STYLE,
  },
  {
    keywords: ["personal", "self care", "wellness", "beauty", "salon", "spa"],
    icon: Heart,
    ...PINK_STYLE,
  },
];

export function getCategoryMeta(name: string): CategoryMeta {
  const normalized = name.toLowerCase().trim();

  for (const item of CATEGORY_MAP) {
    if (
      item.keywords.some(
        (kw) =>
          normalized === kw ||
          normalized.includes(kw) ||
          kw.includes(normalized)
      )
    ) {
      return {
        icon: item.icon,
        badgeClass: item.badgeClass,
        iconBgClass: item.iconBgClass,
      };
    }
  }

  return DEFAULT_META;
}
