"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "bg-surface text-gray-1000 flex h-full w-full flex-col overflow-hidden rounded-md",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: React.ReactNode;
};

const CommandDialog = ({
  open,
  onOpenChange,
  label,
  children,
}: CommandDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="overflow-hidden p-0">
      <DialogTitle className="sr-only">{label}</DialogTitle>
      <Command loop>{children}</Command>
    </DialogContent>
  </Dialog>
);

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="border-alpha-300 flex items-center gap-x-2.5 border-b px-4">
    <Search className="size-4 shrink-0 text-gray-700" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "label-14 text-gray-1000 flex h-12 w-full bg-transparent outline-none placeholder:text-gray-700 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-80 overflow-x-hidden overflow-y-auto p-1.5",
      className
    )}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="copy-13 py-8 text-center text-gray-900"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "text-gray-1000 [&_[cmdk-group-heading]]:label-12 overflow-hidden [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-800",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "label-14 data-[selected=true]:bg-alpha-200 data-[selected=true]:text-gray-1000 relative flex cursor-default items-center gap-x-2.5 rounded-sm px-2.5 py-2 text-gray-900 outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("numeric ml-auto text-xs text-gray-700", className)}
    {...props}
  />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
};
