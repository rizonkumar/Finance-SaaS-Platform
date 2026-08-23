import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/constants";
import {
  ACCOUNT_TYPES,
  displayOpeningBalance,
  isLiabilityAccount,
  signOpeningBalance,
  type AccountType,
} from "@/lib/net-worth";
import {
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
} from "@/lib/utils";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(ACCOUNT_TYPES),
  openingBalance: z.string("Enter a starting balance"),
});

export type AccountFormValues = z.output<typeof formSchema>;

export type AccountApiValues = {
  name: string;
  type: AccountType;
  openingBalance: number;
};

type Account = {
  name: string;
  type: AccountType;
  openingBalance: number;
};

export const toAccountFormValues = (account?: Account): AccountFormValues => {
  if (!account) {
    return { name: "", type: "checking", openingBalance: "" };
  }

  const amount = displayOpeningBalance(
    account.type,
    convertAmountFromMiliunits(account.openingBalance)
  );

  return {
    name: account.name,
    type: account.type,
    openingBalance: amount === 0 ? "" : String(amount),
  };
};

type Props = {
  id?: string;
  defaultValues?: AccountFormValues;
  onSubmit: (values: AccountApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
};

export const AccountForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
}: Props) => {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const type = useWatch({ control: form.control, name: "type" });
  const owesMoney = isLiabilityAccount(type ?? "checking");

  const handleSubmit = (values: AccountFormValues) => {
    const entered = parseFloat(values.openingBalance);

    onSubmit({
      name: values.name,
      type: values.type,
      openingBalance: convertAmountToMiliunits(
        signOpeningBalance(values.type, Number.isNaN(entered) ? 0 : entered)
      ),
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
                  disabled={disabled}
                  placeholder="e.g. Cash, Bank, Credit Card"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a type"
                  options={ACCOUNT_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Credit cards count against your net worth, everything else
                counts towards it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="openingBalance"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {owesMoney ? "Amount owed today" : "Opening balance"}
              </FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? "")}
                  placeholder="0.00"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                {owesMoney
                  ? "What is on the card before you record any transactions."
                  : "What the account held before you record any transactions."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save changes" : "Create account"}
        </Button>
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            isLoading={isDeleting}
            onClick={onDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="mr-2 size-4" />
            Delete account
          </Button>
        )}
      </form>
    </Form>
  );
};
