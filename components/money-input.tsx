import CurrencyInput from "react-currency-input-field";

import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const MoneyInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: Props) => {
  return (
    <CurrencyInput
      prefix={CURRENCY_SYMBOL}
      className={cn(
        "border-input bg-surface text-gray-1000 hover:border-alpha-500 numeric flex h-10 w-full rounded-sm border px-3 text-sm transition-colors placeholder:text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700",
        className
      )}
      placeholder={placeholder}
      value={value}
      decimalsLimit={2}
      decimalScale={2}
      onValueChange={onChange}
      disabled={disabled}
    />
  );
};
