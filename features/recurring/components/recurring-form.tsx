import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { AmountInput } from "@/components/amount-input";
import { MoneyInput } from "@/components/money-input";
import { DatePicker } from "@/components/date-picker";
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
import { Textarea } from "@/components/ui/textarea";
import type { DebtOption } from "@/features/recurring/debt-prefill";
import { convertAmountToMiliunits } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const formSchema = z
  .object({
    payee: z
      .string("Enter a name")
      .min(1, "Enter a name, e.g. Landlord or your employer"),
    amount: z
      .string()
      .min(1, "Enter an amount")
      .refine((value) => parseFloat(value) !== 0, "Enter an amount"),
    accountId: z.string().min(1, "Select an account"),
    toAccountId: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    debtId: z.string().nullable().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.string().min(1, "Enter an interval"),
    startDate: z.date(),
    endDate: z.date().nullable().optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.toAccountId && value.toAccountId === value.accountId) {
      ctx.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Pick a different account to transfer into",
      });
    }
  });

export type RecurringFormValues = z.output<typeof formSchema>;

export type RecurringApiValues = {
  payee: string;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  debtId: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  isActive: boolean;
};

type Props = {
  id?: string;
  defaultValues?: RecurringFormValues;
  onSubmit: (values: RecurringApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  debtOptions: DebtOption[];
  onCreateAccount: (name: string) => void;
  onCreateCategory: (name: string) => void;
};

export const RecurringForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  accountOptions,
  categoryOptions,
  debtOptions,
  onCreateAccount,
  onCreateCategory,
}: Props) => {
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const toAccountId = useWatch({ control: form.control, name: "toAccountId" });
  const debtId = useWatch({ control: form.control, name: "debtId" });
  const isTransfer = Boolean(toAccountId);
  const isDebt = Boolean(debtId);

  const onDebtChange = (value?: string) => {
    const picked = debtOptions.find((option) => option.value === value);

    form.setValue("debtId", value ?? null, { shouldValidate: true });

    if (!picked) return;

    const { payee, amount, accountId, endDate } = picked.prefill;

    form.setValue("payee", payee, { shouldValidate: true });
    form.setValue("amount", amount, { shouldValidate: true });
    form.setValue("accountId", accountId, { shouldValidate: true });
    form.setValue("endDate", endDate, { shouldValidate: true });
  };

  const handleSubmit = (values: RecurringFormValues) => {
    const entered = parseFloat(values.amount);

    onSubmit({
      payee: values.payee,
      amount: convertAmountToMiliunits(
        values.toAccountId ? Math.abs(entered) : entered
      ),
      accountId: values.accountId,
      toAccountId: values.toAccountId ?? null,
      categoryId: values.toAccountId ? null : (values.categoryId ?? null),
      debtId: values.toAccountId ? null : (values.debtId ?? null),
      frequency: values.frequency,
      interval: parseInt(values.interval, 10),
      startDate: values.startDate,
      endDate: values.endDate ?? null,
      notes: values.notes ?? null,
      isActive: values.isActive,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        {!isTransfer && debtOptions.length > 0 && (
          <FormField
            name="debtId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logs against debt (optional)</FormLabel>
                <FormControl>
                  <Select
                    placeholder="Not a debt payment"
                    options={debtOptions}
                    value={field.value}
                    onChange={onDebtChange}
                    disabled={disabled}
                    isClearable
                  />
                </FormControl>
                <FormDescription>
                  Picking one fills the rest in from the debt, which you can
                  still change. Each run records a payment against it, so the
                  balance shrinks on its own, and still counts as an expense.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          name="payee"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isTransfer ? "Label" : "Paid to or received from"}
              </FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder={
                    isTransfer ? "e.g. Groww SIP" : "e.g. Rent, Netflix"
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isTransfer
                  ? "How this schedule is listed. Each entry is named after the account it moves to or from."
                  : "Who the money goes to, or comes from."}
              </FormDescription>
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
                {isTransfer ? (
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    placeholder="0.00"
                  />
                ) : (
                  <AmountInput
                    {...field}
                    disabled={disabled}
                    placeholder="0.00"
                  />
                )}
              </FormControl>
              {isTransfer && (
                <FormDescription>
                  How much moves across on each run.
                </FormDescription>
              )}
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
        {!isDebt && (
          <FormField
            name="toAccountId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer to (optional)</FormLabel>
                <FormControl>
                  <Select
                    placeholder="Not a transfer"
                    options={accountOptions}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    isClearable
                  />
                </FormControl>
                <FormDescription>
                  Pick a destination to schedule a transfer, such as a monthly
                  SIP. Each run records both sides and is left out of income,
                  expenses and budgets.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!isTransfer && (
          <FormField
            name="categoryId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
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
        <FormField
          name="frequency"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repeats</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a frequency"
                  options={FREQUENCY_OPTIONS}
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
          name="interval"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Every</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Repeat every N periods — 2 with a weekly frequency means
                fortnightly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="startDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starts</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Past occurrences are generated automatically up to today.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="endDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ends (optional)</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                  allowClear
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
                  placeholder="Anything worth remembering"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save Changes" : "Create Recurring Transaction"}
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
            Delete Recurring Transaction
          </Button>
        )}
      </form>
    </Form>
  );
};
