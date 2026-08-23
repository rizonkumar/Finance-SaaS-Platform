import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
import { convertAmountToMiliunits } from "@/lib/utils";

const OVERALL = "__overall__";

const PERIOD_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom range", value: "custom" },
];

const formSchema = z
  .object({
    categoryId: z.string().nullable().optional(),
    amount: z.string().min(1, "Enter an amount"),
    period: z.enum(["weekly", "monthly", "yearly", "custom"]),
    startDate: z.date(),
    endDate: z.date().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.period === "custom" && !value.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "An end date is required for a custom period",
      });
    }
  });

export type BudgetFormValues = z.output<typeof formSchema>;

export type BudgetApiValues = {
  categoryId: string | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly" | "custom";
  startDate: Date;
  endDate: Date | null;
};

type Props = {
  id?: string;
  defaultValues?: BudgetFormValues;
  onSubmit: (values: BudgetApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  categoryOptions: { label: string; value: string }[];
};

export const BudgetForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  categoryOptions,
}: Props) => {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const period = useWatch({ control: form.control, name: "period" });

  const handleSubmit = (values: BudgetFormValues) => {
    onSubmit({
      categoryId:
        !values.categoryId || values.categoryId === OVERALL
          ? null
          : values.categoryId,
      amount: convertAmountToMiliunits(Math.abs(parseFloat(values.amount))),
      period: values.period,
      startDate: values.startDate,
      endDate: values.endDate ?? null,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select
                  placeholder="Overall spending"
                  options={[
                    { label: "Overall spending", value: OVERALL },
                    ...categoryOptions,
                  ]}
                  value={field.value ?? OVERALL}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Leave as overall spending to budget across every category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="period"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a period"
                  options={PERIOD_OPTIONS}
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
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limit</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
              <FormDescription>
                The most you want to spend in this period. Spending is counted
                across every account.
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
              <FormLabel>Active from</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                {period === "custom"
                  ? "The budget measures the range you pick here."
                  : "When the budget starts applying. A monthly budget always measures the whole calendar month, a weekly one the calendar week."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {period === "custom" && (
          <FormField
            name="endDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ends</FormLabel>
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
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save Changes" : "Create Budget"}
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
            Delete Budget
          </Button>
        )}
      </form>
    </Form>
  );
};
