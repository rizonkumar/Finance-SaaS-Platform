import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { DirectionToggle } from "@/components/direction-toggle";
import { MoneyInput } from "@/components/money-input";
import { signedAmount, unsignedAmount } from "@/lib/utils";

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
  const [preferredSign, setPreferredSign] = useState<1 | -1>(-1);

  const parsedValue = parseFloat(value);
  const hasValue = value !== "" && !isNaN(parsedValue) && parsedValue !== 0;
  const isCredit = hasValue ? parsedValue > 0 : preferredSign === 1;
  const isDebit = !isCredit;

  const magnitude = unsignedAmount(value);

  const selectType = (sign: 1 | -1) => {
    setPreferredSign(sign);

    if (magnitude) onChange(signedAmount(magnitude, sign));
  };

  const onValueChange = (rawValue: string | undefined) => {
    onChange(signedAmount(rawValue, isDebit ? -1 : 1));
  };

  return (
    <div className="space-y-2">
      <DirectionToggle
        value={isCredit ? "credit" : "debit"}
        onChange={(next) => selectType(next === "credit" ? 1 : -1)}
        disabled={disabled}
        positive={{ value: "credit", label: "Credit", icon: ArrowUpCircle }}
        negative={{ value: "debit", label: "Debit", icon: ArrowDownCircle }}
      />
      <MoneyInput
        placeholder={placeholder}
        value={magnitude}
        onChange={onValueChange}
        disabled={disabled}
      />
      <p className="copy-13 text-gray-900">
        {isDebit
          ? "Debit: money going out, e.g. a purchase or subscription charge."
          : "Credit: money coming in, e.g. a salary payment or refund."}
      </p>
    </div>
  );
};
