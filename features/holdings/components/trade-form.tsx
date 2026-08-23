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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { QUANTITY_FACTOR } from "@/lib/holdings";
import { convertAmountToMiliunits } from "@/lib/utils";

const positiveNumber = (value: string) => {
  const parsed = parseFloat(value);

  return !Number.isNaN(parsed) && parsed > 0;
};

const formSchema = z.object({
  side: z.enum(["buy", "sell"]),
  quantity: z
    .string("Enter a quantity")
    .min(1, "Enter a quantity")
    .refine(positiveNumber, "Enter a quantity above zero"),
  price: z
    .string("Enter a price")
    .min(1, "Enter a price")
    .refine(positiveNumber, "Enter a price above zero"),
  fees: z.string(),
  date: z.date("Pick a date"),
});

export type TradeFormValues = z.output<typeof formSchema>;

export type TradeApiValues = {
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  date: Date;
};

type Props = {
  onSubmit: (values: TradeApiValues) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export const TradeForm = ({ onSubmit, disabled, isSubmitting }: Props) => {
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      side: "buy",
      quantity: "",
      price: "",
      fees: "",
      date: new Date(),
    },
  });

  const handleSubmit = (values: TradeFormValues) => {
    const fees = parseFloat(values.fees);

    onSubmit({
      side: values.side,
      quantity: Math.round(parseFloat(values.quantity) * QUANTITY_FACTOR),
      price: convertAmountToMiliunits(parseFloat(values.price)),
      fees: convertAmountToMiliunits(Number.isNaN(fees) ? 0 : fees),
      date: values.date,
    });

    form.reset({
      side: values.side,
      quantity: "",
      price: values.price,
      fees: "",
      date: values.date,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          name="side"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DirectionToggle
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  positive={{ value: "buy", label: "Buy", icon: PlusCircle }}
                  negative={{ value: "sell", label: "Sell", icon: MinusCircle }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="quantity"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Units</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  disabled={disabled}
                  placeholder="0"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Fractional units are fine, for mutual funds.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="price"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price per unit</FormLabel>
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
          name="fees"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fees (optional)</FormLabel>
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
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          Record Trade
        </Button>
      </form>
    </Form>
  );
};
