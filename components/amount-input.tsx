import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { MoneyInput } from "@/components/money-input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

const TOGGLE_BASE =
  "flex flex-1 items-center justify-center gap-x-1.5 rounded-sm border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700";
const TOGGLE_IDLE = "border-input text-gray-900 hover:bg-alpha-100";

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

    const currentSign = isDebit ? -1 : 1;
    const sign = hasValue ? currentSign : preferredSign;
    const magnitude = Math.abs(parseFloat(rawValue));

    onChange((magnitude * sign).toString());
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-x-2">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={isCredit}
          onClick={() => selectType(1)}
          className={cn(
            TOGGLE_BASE,
            isCredit
              ? "border-green-500 bg-green-100 text-green-900"
              : TOGGLE_IDLE
          )}
        >
          <ArrowUpCircle className="size-4" />
          Credit
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={isDebit}
          onClick={() => selectType(-1)}
          className={cn(
            TOGGLE_BASE,
            isDebit ? "border-red-500 bg-red-100 text-red-900" : TOGGLE_IDLE
          )}
        >
          <ArrowDownCircle className="size-4" />
          Debit
        </button>
      </div>
      <MoneyInput
        placeholder={placeholder}
        value={value}
        onChange={onValueChange}
        disabled={disabled}
      />
      <p className="copy-13 text-gray-900">
        {isCredit && "Credit: money coming in, e.g. a salary payment."}
        {isDebit && "Debit: money going out, e.g. a subscription charge."}
        {!hasValue &&
          "Pick Credit for money in (salary, refunds) or Debit for money out (subscriptions, purchases), then enter the amount."}
      </p>
    </div>
  );
};
