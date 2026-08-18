"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { useClerkAppearance } from "@/components/clerk-appearance";

type Props = {
  mode: "sign-in" | "sign-up";
};

const COPY = {
  "sign-in": {
    title: "Welcome back",
    description: "Sign in to pick up where you left off.",
  },
  "sign-up": {
    title: "Create your account",
    description: "Start tracking your accounts, budgets and spending.",
  },
} as const;

export const AuthPanel = ({ mode }: Props) => {
  const appearance = useClerkAppearance();
  const { title, description } = COPY[mode];

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="heading-24 text-gray-1000">{title}</h1>
        <p className="copy-14 text-gray-900">{description}</p>
      </div>

      <ClerkLoaded>
        {mode === "sign-in" ? (
          <SignIn path="/sign-in" appearance={appearance} />
        ) : (
          <SignUp path="/sign-up" appearance={appearance} />
        )}
      </ClerkLoaded>
      <ClerkLoading>
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-gray-600" />
        </div>
      </ClerkLoading>
    </div>
  );
};
