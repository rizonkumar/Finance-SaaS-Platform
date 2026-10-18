import { type z } from "zod";
import { Trash } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { insertCategoryRuleSchema } from "@/db/schema";
import { RULE_MATCH_LABELS, RULE_MATCH_OPTIONS } from "@/lib/category-rules";

const formSchema = insertCategoryRuleSchema.pick({
  pattern: true,
  match: true,
  categoryId: true,
  priority: true,
});

export type RuleFormValues = z.input<typeof formSchema>;
export type RuleApiValues = z.output<typeof formSchema>;

export const EMPTY_RULE: RuleFormValues = {
  pattern: "",
  match: "contains",
  categoryId: "",
  priority: 0,
};

type Props = {
  id?: string;
  defaultValues?: RuleFormValues;
  onSubmit: (values: RuleApiValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  categoryOptions: { label: string; value: string }[];
  onCreateCategory: (name: string) => void;
};

export const RuleForm = ({
  id,
  defaultValues = EMPTY_RULE,
  onSubmit,
  onDelete,
  disabled,
  isSubmitting,
  isDeleting,
  categoryOptions,
  onCreateCategory,
}: Props) => {
  const form = useForm<RuleFormValues, unknown, RuleApiValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [match = "contains", pattern, categoryId] = useWatch({
    control: form.control,
    name: ["match", "pattern", "categoryId"],
  });
  const categoryName = categoryOptions.find(
    (option) => option.value === categoryId
  )?.label;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          name="match"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>When the payee</FormLabel>
              <FormControl>
                <Select
                  placeholder="Choose how to match"
                  options={RULE_MATCH_OPTIONS}
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
          name="pattern"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="e.g. swiggy"
                />
              </FormControl>
              <FormDescription>
                Upper and lower case are ignored.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Put it in</FormLabel>
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
        <FormField
          name="priority"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={String(field.value ?? 0)}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormDescription>
                When two rules match, the higher priority wins.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {pattern && categoryName && (
          <p className="copy-13 rounded-sm bg-gray-100 px-3 py-2 text-gray-900">
            Payees that {RULE_MATCH_LABELS[match]} &ldquo;{pattern}&rdquo; go to{" "}
            <span className="text-gray-1000 font-medium">{categoryName}</span>.
          </p>
        )}
        <Button className="w-full" disabled={disabled} isLoading={isSubmitting}>
          {id ? "Save changes" : "Create rule"}
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
            <Trash />
            Delete rule
          </Button>
        )}
      </form>
    </Form>
  );
};
