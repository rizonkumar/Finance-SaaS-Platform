import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/date-picker";
import { MoneyInput } from "@/components/money-input";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DEBT_KIND_OPTIONS, type DebtKind } from "@/features/debts/kinds";
import { aprToBasisPoints } from "@/lib/debts";
import { convertAmountToMiliunits } from "@/lib/utils";

const UNLINKED = "__unlinked__";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    kind: z.enum(["loan", "credit-card", "other"]),
    principal: z.string().min(1, "Enter the amount owed"),
    apr: z
      .string()
      .refine(
        (value) => value === "" || Number.isFinite(parseFloat(value)),
        "Enter a rate, or leave it blank"
      )
      .refine(
        (value) => value === "" || parseFloat(value) >= 0,
        "A rate cannot be negative"
      ),
    minimumPayment: z.string(),
    accountId: z.string().nullable().optional(),
    startDate: z.date(),
    hasDeadline: z.boolean(),
    targetDate: z.date().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.hasDeadline) return;

    if (!value.targetDate) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "Pick a target date, or turn the deadline off",
      });
      return;
    }

    if (value.targetDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "The target date cannot be before the start date",
      });
    }
  });

export type DebtFormValues = z.output<typeof formSchema>;

export type DebtApiValues = {
  name: string;
  kind: DebtKind;
  principal: number;
  aprBasisPoints: number;
  minimumPayment: number;
  accountId: string | null;
  startDate: Date;
  targetDate: Date | null;
  notes: string | null;
};

type Props = {
  id?: string;
  defaultValues?: DebtFormValues;
  onSubmit: (values: DebtApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  accountOptions: { label: string; value: string }[];
};

const money = (value: string) => {
  const parsed = parseFloat(value);

  return Number.isFinite(parsed)
    ? convertAmountToMiliunits(Math.abs(parsed))
    : 0;
};

export const DebtForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  accountOptions,
}: Props) => {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const hasDeadline = useWatch({ control: form.control, name: "hasDeadline" });

  const handleSubmit = (values: DebtFormValues) => {
    onSubmit({
      name: values.name,
      kind: values.kind,
      principal: money(values.principal),
      aprBasisPoints: values.apr ? aprToBasisPoints(parseFloat(values.apr)) : 0,
      minimumPayment: money(values.minimumPayment),
      accountId:
        !values.accountId || values.accountId === UNLINKED
          ? null
          : values.accountId,
      startDate: values.startDate,
      targetDate: values.hasDeadline ? (values.targetDate ?? null) : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="e.g. Car loan"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="kind"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a type"
                  options={DEBT_KIND_OPTIONS}
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
          name="principal"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount owed</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
              <FormDescription>
                The balance when you started tracking. Payments are recorded
                separately, so this figure stays as the opening one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="apr"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest rate (APR %)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  inputMode="decimal"
                  disabled={disabled}
                  placeholder="e.g. 18.99"
                />
              </FormControl>
              <FormDescription>
                Leave blank for an interest free debt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="minimumPayment"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly payment</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
              <FormDescription>
                What you pay each month. The payoff date is projected from this.
              </FormDescription>
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
                  placeholder="Not linked"
                  options={[
                    { label: "Not linked", value: UNLINKED },
                    ...accountOptions,
                  ]}
                  value={field.value ?? UNLINKED}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Linking is a label only — it does not move any money.
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
              <FormLabel>Started</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="hasDeadline"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-y-0 gap-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Clear it by a target date
              </FormLabel>
            </FormItem>
          )}
        />
        {hasDeadline && (
          <FormField
            name="targetDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ?? undefined}
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
                  placeholder="Lender, account number, anything worth keeping"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save Changes" : "Add Debt"}
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
            Delete Debt
          </Button>
        )}
      </form>
    </Form>
  );
};
