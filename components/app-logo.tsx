import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const AppLogo = () => {
  return (
    <Link
      href="/"
      className="flex items-center gap-x-2.5 rounded-sm px-2 py-1"
      aria-label="Fintrack home"
    >
      <BrandMark className="size-5 text-blue-700" />
      <span className="heading-16 text-gray-1000">Fintrack</span>
    </Link>
  );
};
