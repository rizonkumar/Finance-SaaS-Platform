import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MoneyInput } from "@/components/money-input";
import { Select } from "@/components/select";
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
import { convertAmountToMiliunits } from "@/lib/utils";

const formSchema = z.object({
  accountId: z.string("Pick an account").min(1, "Pick an account"),
  symbol: z.string("Enter a symbol").min(1, "Enter a symbol"),
  name: z.string("Enter a name").min(1, "Enter a name"),
  lastPrice: z.string(),
});

export type HoldingFormValues = z.output<typeof formSchema>;

export type HoldingApiValues = {
  accountId: string;
  symbol: string;
  name: string;
  lastPrice: number;
};

type Props = {
  id?: string;
  defaultValues?: Partial<HoldingFormValues>;
  onSubmit: (values: HoldingApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  accountOptions: { label: string; value: string }[];
};

const EMPTY_VALUES: HoldingFormValues = {
  accountId: "",
  symbol: "",
  name: "",
  lastPrice: "",
};

export const HoldingForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  accountOptions,
}: Props) => {
  const form = useForm<HoldingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const handleSubmit = (values: HoldingFormValues) => {
    const price = parseFloat(values.lastPrice);

    onSubmit({
      accountId: values.accountId,
      symbol: values.symbol.trim().toUpperCase(),
      name: values.name.trim(),
      lastPrice: convertAmountToMiliunits(Number.isNaN(price) ? 0 : price),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="accountId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select an account"
                  options={accountOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                The broker or fund account this is held in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="symbol"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="e.g. RELIANCE"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="e.g. Reliance Industries"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="lastPrice"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current price</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
              <FormDescription>
                Price of one unit today. Update it whenever you want the value
                refreshed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save changes" : "Add holding"}
        </Button>
        {!!id && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
            isLoading={isDeleting}
            onClick={onDelete}
          >
            <Trash className="size-4" />
            Delete holding
          </Button>
        )}
      </form>
    </Form>
  );
};
