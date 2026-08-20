import { zodResolver } from "@hookform/resolvers/zod";
import { MinusCircle, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/date-picker";
import { DirectionToggle } from "@/components/direction-toggle";
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
import { convertAmountToMiliunits } from "@/lib/utils";

const formSchema = z.object({
  direction: z.enum(["pay", "borrow"]),
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((value) => Math.abs(parseFloat(value)) > 0, "Enter an amount"),
  date: z.date(),
  notes: z.string().nullable().optional(),
});

export type PaymentFormValues = z.output<typeof formSchema>;

export type PaymentApiValues = {
  amount: number;
  date: Date;
  notes: string | null;
};

type Props = {
  onSubmit: (values: PaymentApiValues) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export const PaymentForm = ({ onSubmit, disabled, isSubmitting }: Props) => {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direction: "pay",
      amount: "",
      date: new Date(),
      notes: null,
    },
  });

  const handleSubmit = (values: PaymentFormValues) => {
    const magnitude = convertAmountToMiliunits(
      Math.abs(parseFloat(values.amount))
    );

    onSubmit({
      amount: values.direction === "borrow" ? -magnitude : magnitude,
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
                <DirectionToggle
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  positive={{ value: "pay", label: "Pay", icon: PlusCircle }}
                  negative={{
                    value: "borrow",
                    label: "Borrow",
                    icon: MinusCircle,
                  }}
                />
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
                  placeholder="e.g. Rounded up this month"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          Record Entry
        </Button>
      </form>
    </Form>
  );
};
