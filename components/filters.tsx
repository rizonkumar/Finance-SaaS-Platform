import { AccountFilter } from "@/components/account-filter";
import { DateFilter } from "@/components/date-filter";

export const Filters = () => {
  return (
    <div className="flex w-full flex-col items-stretch gap-2 lg:w-auto lg:flex-row lg:items-center">
      <AccountFilter />
      <DateFilter />
    </div>
  );
};
