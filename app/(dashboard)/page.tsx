"use client";

import { Button } from "@/components/ui/button";
import { useNewAccount } from "@/features/accounts/hooks/use-new-category";

export default function Home() {
  const { onOpen, onClose } = useNewAccount();

  return (
    <div>
      <Button onClick={onOpen}>Add an account</Button>
    </div>
  );
}
