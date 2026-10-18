import { type z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { insertUserSettingsSchema } from "@/db/schema";
import { WEEK_START_OPTIONS } from "@/lib/calendar";
import { CURRENCY_OPTIONS, formatMoney, findCurrency } from "@/lib/currency";

const formSchema = insertUserSettingsSchema.pick({
  currency: true,
  weekStartsOn: true,
});

type FormValues = z.input<typeof formSchema>;
export type PreferencesValues = z.output<typeof formSchema>;

const WEEK_OPTIONS = WEEK_START_OPTIONS.map(({ value, label }) => ({
  value: String(value),
  label,
}));

const SAMPLE_AMOUNT = 123456.78;

type Props = {
  defaultValues: PreferencesValues;
  onSubmit: (values: PreferencesValues) => void;
  isSubmitting?: boolean;
};

export const PreferencesForm = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}: Props) => {
  const form = useForm<FormValues, unknown, PreferencesValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid max-w-xl gap-4"
      >
        <FormField
          name="currency"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a currency"
                  options={CURRENCY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Amounts show as{" "}
                {formatMoney(SAMPLE_AMOUNT, findCurrency(field.value ?? ""))}.
                Stored amounts are not converted.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="weekStartsOn"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Week starts on</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a day"
                  options={WEEK_OPTIONS}
                  value={String(field.value)}
                  onChange={(value) => field.onChange(Number(value))}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Used by weekly budgets and the calendar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="justify-self-start"
          isLoading={isSubmitting}
        >
          Save preferences
        </Button>
      </form>
    </Form>
  );
};
