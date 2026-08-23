import { AccountFilter } from "@/components/account-filter";
import { DateFilter } from "@/components/date-filter";

export const Filters = () => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AccountFilter />
      <DateFilter />
    </div>
  );
};
