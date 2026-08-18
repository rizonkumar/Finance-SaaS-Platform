import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const AmountInput = ({
  value,
  onChange,
  placeholder,
  disabled,
}: Props) => {
  const [preferredSign, setPreferredSign] = useState<1 | -1>(1);

  const parsedValue = parseFloat(value);
  const hasValue = value !== "" && !isNaN(parsedValue) && parsedValue !== 0;
  const isCredit = hasValue && parsedValue > 0;
  const isDebit = hasValue && parsedValue < 0;

  const selectType = (sign: 1 | -1) => {
    setPreferredSign(sign);

    if (hasValue) {
      onChange((Math.abs(parsedValue) * sign).toString());
    }
  };

  const onValueChange = (rawValue: string | undefined) => {
    if (!rawValue) {
      onChange(rawValue);
      return;
    }

    const sign = hasValue ? (isDebit ? -1 : 1) : preferredSign;
    const magnitude = Math.abs(parseFloat(rawValue));

    onChange((magnitude * sign).toString());
  };

  return (
    <div>
      <div className="flex gap-x-2 mb-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => selectType(1)}
          className={cn(
            "flex-1 flex items-center justify-center gap-x-1.5 rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            isCredit
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-input text-muted-foreground hover:bg-accent"
          )}
        >
          <ArrowUpCircle className="size-4" />
          Credit
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => selectType(-1)}
          className={cn(
            "flex-1 flex items-center justify-center gap-x-1.5 rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            isDebit
              ? "border-rose-500 bg-rose-50 text-rose-700"
              : "border-input text-muted-foreground hover:bg-accent"
          )}
        >
          <ArrowDownCircle className="size-4" />
          Debit
        </button>
      </div>
      <CurrencyInput
        prefix="$"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder}
        value={value}
        decimalsLimit={2}
        decimalScale={2}
        onValueChange={onValueChange}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground mt-2">
        {isCredit && "Credit: money coming in, e.g. a salary payment."}
        {isDebit && "Debit: money going out, e.g. a subscription charge."}
        {!hasValue &&
          "Pick Credit for money in (salary, refunds) or Debit for money out (subscriptions, purchases), then enter the amount."}
      </p>
    </div>
  );
};
