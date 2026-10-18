"use client";

import { type z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertSavedViewSchema } from "@/db/schema";
import { useCreateView } from "@/features/views/api/use-create-view";
import { useEditView } from "@/features/views/api/use-edit-view";
import {
  useViewDialog,
  type ViewDraft,
} from "@/features/views/hooks/use-view-dialog";
import { describeViewQuery, VIEW_EMOJIS } from "@/lib/saved-views";
import { pageMeta } from "@/lib/routes";
import { cn } from "@/lib/utils";

const formSchema = insertSavedViewSchema.pick({
  name: true,
  emoji: true,
  isPinned: true,
});

type FormValues = z.input<typeof formSchema>;

type FormProps = {
  draft: ViewDraft;
  onDone: () => void;
};

const ViewForm = ({ draft, onDone }: FormProps) => {
  const createView = useCreateView();
  const editView = useEditView();
  const isPending = createView.isPending || editView.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: draft.name,
      emoji: draft.emoji,
      isPinned: draft.isPinned,
    },
  });

  const onSubmit = (values: FormValues) => {
    if (draft.id) {
      editView.mutate({ id: draft.id, ...values }, { onSuccess: onDone });
      return;
    }

    createView.mutate(
      { ...values, route: draft.route, query: draft.query },
      { onSuccess: onDone }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoFocus
                  disabled={isPending}
                  placeholder="e.g. Groceries this month"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="emoji"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <div
                role="radiogroup"
                aria-label="Icon"
                className="flex flex-wrap gap-1.5"
              >
                {VIEW_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="radio"
                    aria-checked={field.value === emoji}
                    disabled={isPending}
                    onClick={() =>
                      field.onChange(field.value === emoji ? null : emoji)
                    }
                    className={cn(
                      "border-alpha-300 hover:bg-alpha-100 flex size-9 items-center justify-center rounded-sm border text-base transition-colors",
                      field.value === emoji && "bg-alpha-200 border-alpha-500"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </FormItem>
          )}
        />
        <FormField
          name="isPinned"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex items-center space-y-0 gap-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                  disabled={isPending}
                />
              </FormControl>
              <FormLabel className="font-normal">Pin to the sidebar</FormLabel>
            </FormItem>
          )}
        />
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {draft.id ? "Save changes" : "Save view"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const ViewDialog = () => {
  const { isOpen, prefill, onClose } = useViewDialog();

  const summary = prefill
    ? `${pageMeta(prefill.route)?.title ?? prefill.route} · ${describeViewQuery(prefill.query)}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {prefill?.id ? "Edit saved view" : "Save this view"}
          </DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        {prefill && (
          <ViewForm
            key={prefill.id ?? `${prefill.route}?${prefill.query}`}
            draft={prefill}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
