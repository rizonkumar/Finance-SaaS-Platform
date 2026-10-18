import { AccountFilter } from "@/components/account-filter";
import { DateFilter } from "@/components/date-filter";

type Props = {
  defaultDays?: number;
};

export const Filters = ({ defaultDays }: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AccountFilter />
      <DateFilter defaultDays={defaultDays} />
    </div>
  );
};
