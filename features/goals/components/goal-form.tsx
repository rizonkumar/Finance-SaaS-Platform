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
import { convertAmountToMiliunits } from "@/lib/utils";

const UNLINKED = "__unlinked__";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    targetAmount: z.string().min(1, "Enter a target amount"),
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

export type GoalFormValues = z.output<typeof formSchema>;

export type GoalApiValues = {
  name: string;
  targetAmount: number;
  accountId: string | null;
  startDate: Date;
  targetDate: Date | null;
  notes: string | null;
};

type Props = {
  id?: string;
  defaultValues?: GoalFormValues;
  onSubmit: (values: GoalApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accountOptions: { label: string; value: string }[];
};

export const GoalForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accountOptions,
}: Props) => {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const hasDeadline = useWatch({ control: form.control, name: "hasDeadline" });

  const handleSubmit = (values: GoalFormValues) => {
    onSubmit({
      name: values.name,
      targetAmount: convertAmountToMiliunits(
        Math.abs(parseFloat(values.targetAmount))
      ),
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
                  placeholder="e.g. Emergency fund"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="targetAmount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target amount</FormLabel>
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
              <FormDescription>
                Pace is measured from this date to the target date.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="hasDeadline"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex-row items-center space-y-0 gap-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Finish by a target date
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
                  placeholder="What is this goal for?"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled}>
          {id ? "Save Changes" : "Create Goal"}
        </Button>
        {!!id && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={onDelete}
          >
            <Trash className="size-4" />
            Delete Goal
          </Button>
        )}
      </form>
    </Form>
  );
};
