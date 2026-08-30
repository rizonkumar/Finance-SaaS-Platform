import CurrencyInput from "react-currency-input-field";

import { FIELD_BASE } from "@/components/ui/field-styles";
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
      className={cn(FIELD_BASE, "numeric h-10", className)}
      placeholder={placeholder}
      value={value}
      decimalsLimit={2}
      decimalScale={2}
      onValueChange={onChange}
      disabled={disabled}
    />
  );
};
