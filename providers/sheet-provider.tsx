"use client";

import { useMountedState } from "react-use";

import { NewAccountSheet } from "@/features/components/new-account-sheet";
import { EditAccountSheet } from "@/features/components/edit-account-sheet";

export const SheetProvider = () => {
  const isMounted = useMountedState();

  if (!isMounted) return null;

  return (
    <>
      <NewAccountSheet />
      <EditAccountSheet />
    </>
  );
};
