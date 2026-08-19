import { zodResolver } from "@hookform/resolvers/zod";
import { MinusCircle, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/date-picker";
import { MoneyInput } from "@/components/money-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn, convertAmountToMiliunits } from "@/lib/utils";

const TOGGLE_BASE =
  "flex flex-1 items-center justify-center gap-x-1.5 rounded-sm border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700";
const TOGGLE_IDLE = "border-input text-gray-900 hover:bg-alpha-100";

const formSchema = z.object({
  direction: z.enum(["add", "withdraw"]),
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((value) => Math.abs(parseFloat(value)) > 0, "Enter an amount"),
  date: z.date(),
  notes: z.string().nullable().optional(),
});

export type ContributionFormValues = z.output<typeof formSchema>;

export type ContributionApiValues = {
  amount: number;
  date: Date;
  notes: string | null;
};

type Props = {
  onSubmit: (values: ContributionApiValues) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export const ContributionForm = ({
  onSubmit,
  disabled,
  isSubmitting,
}: Props) => {
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direction: "add",
      amount: "",
      date: new Date(),
      notes: null,
    },
  });

  const handleSubmit = (values: ContributionFormValues) => {
    const magnitude = convertAmountToMiliunits(
      Math.abs(parseFloat(values.amount))
    );

    onSubmit({
      amount: values.direction === "withdraw" ? -magnitude : magnitude,
      date: values.date,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    });

    form.reset({
      direction: values.direction,
      amount: "",
      date: values.date,
      notes: null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          name="direction"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex gap-x-2">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={field.value === "add"}
                    onClick={() => field.onChange("add")}
                    className={cn(
                      TOGGLE_BASE,
                      field.value === "add"
                        ? "border-green-500 bg-green-100 text-green-900"
                        : TOGGLE_IDLE
                    )}
                  >
                    <PlusCircle className="size-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={field.value === "withdraw"}
                    onClick={() => field.onChange("withdraw")}
                    className={cn(
                      TOGGLE_BASE,
                      field.value === "withdraw"
                        ? "border-red-500 bg-red-100 text-red-900"
                        : TOGGLE_IDLE
                    )}
                  >
                    <MinusCircle className="size-4" />
                    Withdraw
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="notes"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                  placeholder="e.g. Diverted this month's bonus"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full"
          disabled={disabled}
          isLoading={isSubmitting}
        >
          Record Entry
        </Button>
      </form>
    </Form>
  );
};
