import { z } from "zod";
import { Split, Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Select } from "@/components/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { type transactionInputSchema } from "@/db/schema";
import { splitError, splitRemainder, toSplitLines } from "@/lib/splits";
import {
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
  unsignedAmount,
} from "@/lib/utils";
import { AmountInput } from "@/components/amount-input";
import {
  EMPTY_SPLIT,
  SplitFields,
} from "@/features/transactions/components/split-fields";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const toMiliunits = (amount: string) =>
  convertAmountToMiliunits(Number.parseFloat(amount) || 0);

const formSchema = z
  .object({
    date: z.coerce.date("Pick a date"),
    accountId: z.string("Choose an account").min(1, "Choose an account"),
    categoryId: z.string().nullable().optional(),
    payee: z
      .string("Enter a name")
      .min(1, "Enter a name, e.g. Woolworths or your employer"),
    amount: z.string("Enter an amount").min(1, "Enter an amount"),
    notes: z.string().nullable().optional(),
    splits: z.array(
      z.object({
        categoryId: z.string().nullable().optional(),
        amount: z.string(),
      })
    ),
  })
  .superRefine((values, ctx) => {
    if (values.splits.length === 0) return;

    const total = toMiliunits(values.amount);
    const error = splitError(total, toSplitLines(total, values.splits));

    if (error)
      ctx.addIssue({ code: "custom", path: ["splits"], message: error });
  });

const EMPTY_VALUES = {
  date: new Date(),
  accountId: "",
  categoryId: null,
  payee: "",
  amount: "",
  notes: "",
  splits: [],
};

type FormValues = z.input<typeof formSchema>;
export type TransactionApiValues = z.input<typeof transactionInputSchema>;

type Props = {
  id?: string;
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: TransactionApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  onCreateAccount: (name: string) => void;
  onCreateCategory: (name: string) => void;
};

export const TransactionForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  accountOptions,
  categoryOptions,
  onCreateAccount,
  onCreateCategory,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const [amount, splits] = useWatch({
    control: form.control,
    name: ["amount", "splits"],
  });
  const isIncoming = parseFloat(amount) > 0;
  const isSplit = splits.length > 0;
  const total = toMiliunits(amount);
  const remainder = convertAmountFromMiliunits(
    (total < 0 ? -1 : 1) * splitRemainder(total, toSplitLines(total, splits))
  );
  const splitsError = form.formState.errors.splits;

  const startSplit = () => {
    const categoryId = form.getValues("categoryId") ?? null;
    form.setValue("splits", [
      { categoryId, amount: unsignedAmount(amount) },
      EMPTY_SPLIT,
    ]);
  };

  const cancelSplit = () => {
    form.setValue("categoryId", splits[0]?.categoryId ?? null);
    form.setValue("splits", []);
    form.clearErrors("splits");
  };

  const handleSubmit = (values: FormValues) => {
    const amountInMiliunits = toMiliunits(values.amount);
    const lines = toSplitLines(amountInMiliunits, values.splits);

    onSubmit({
      ...values,
      categoryId: lines.length > 0 ? null : values.categoryId,
      amount: amountInMiliunits,
      splits: lines,
    });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DatePicker
                  value={field.value as Date | undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  onCreate={onCreateAccount}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{isSplit ? "Split across" : "Category"}</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={isSplit ? cancelSplit : startSplit}
            >
              <Split />
              {isSplit ? "Use one category" : "Split"}
            </Button>
          </div>
          {isSplit ? (
            <SplitFields
              remainder={remainder}
              error={splitsError?.message ?? splitsError?.root?.message}
              disabled={disabled}
              categoryOptions={categoryOptions}
              onCreateCategory={onCreateCategory}
            />
          ) : (
            <FormField
              name="categoryId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      placeholder="Select a category"
                      options={categoryOptions}
                      onCreate={onCreateCategory}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          name="payee"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isIncoming ? "Received from" : "Paid to"}</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder={
                    isIncoming ? "e.g. Employer, or a refund" : "e.g. Zomato"
                  }
                  {...field}
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
                <AmountInput
                  {...field}
                  disabled={disabled}
                  placeholder="0.00"
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                  placeholder="Optional notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save changes" : "Create transaction"}
        </Button>
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            isLoading={isDeleting}
            onClick={handleDelete}
            className="w-full"
            variant="outline"
          >
            <Trash />
            Delete transaction
          </Button>
        )}
      </form>
    </Form>
  );
};
