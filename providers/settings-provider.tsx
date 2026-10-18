"use client";

import { Fragment } from "react";
import { useAuth } from "@clerk/nextjs";

import { useGetSettings } from "@/features/settings/api/use-get-settings";
import { DEFAULT_CURRENCY_CODE, setActiveCurrency } from "@/lib/currency";

type Props = {
  children: React.ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const { isSignedIn } = useAuth();
  const settingsQuery = useGetSettings({ enabled: isSignedIn === true });
  const currency = settingsQuery.data?.currency ?? DEFAULT_CURRENCY_CODE;

  setActiveCurrency(currency);

  return <Fragment key={currency}>{children}</Fragment>;
};
