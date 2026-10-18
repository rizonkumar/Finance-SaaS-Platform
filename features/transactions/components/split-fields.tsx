import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { MoneyInput } from "@/components/money-input";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { MAX_SPLITS, MIN_SPLITS } from "@/lib/splits";
import { cn, formatCurrency } from "@/lib/utils";

export type SplitFieldValues = {
  splits: { categoryId?: string | null; amount: string }[];
};

export const EMPTY_SPLIT = { categoryId: null, amount: "" };

const remainderLabel = (remainder: number) => {
  if (remainder === 0) return "Fully assigned";

  const amount = formatCurrency(Math.abs(remainder));

  return remainder > 0 ? `${amount} left to assign` : `${amount} over`;
};

type Props = {
  remainder: number;
  error?: string;
  disabled?: boolean;
  categoryOptions: { label: string; value: string }[];
  onCreateCategory: (name: string) => void;
};

export const SplitFields = ({
  remainder,
  error,
  disabled,
  categoryOptions,
  onCreateCategory,
}: Props) => {
  const { control } = useFormContext<SplitFieldValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "splits",
  });

  return (
    <div className="space-y-2">
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-x-2">
          <div className="min-w-0 flex-1">
            <FormField
              name={`splits.${index}.categoryId`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      placeholder="Category"
                      options={categoryOptions}
                      onCreate={onCreateCategory}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            name={`splits.${index}.amount`}
            control={control}
            render={({ field }) => (
              <FormItem className="w-32 shrink-0">
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? "")}
                    placeholder="0.00"
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || fields.length <= MIN_SPLITS}
            onClick={() => remove(index)}
            aria-label="Remove split"
          >
            <X />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-x-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || fields.length >= MAX_SPLITS}
          onClick={() => append(EMPTY_SPLIT)}
        >
          <Plus />
          Add split
        </Button>
        <p
          className={cn(
            "copy-13 numeric",
            remainder === 0 ? "text-green-900" : "text-amber-900"
          )}
        >
          {remainderLabel(remainder)}
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
};
