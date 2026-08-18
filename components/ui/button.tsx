import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-x-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-gray-900",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-900",
        outline:
          "border border-input bg-surface text-gray-1000 hover:bg-alpha-100 active:bg-alpha-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-gray-200 active:bg-gray-300",
        ghost: "text-gray-1000 hover:bg-alpha-100 active:bg-alpha-200",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-2.5",
        sm: "h-8 px-1.5 text-xs",
        lg: "h-12 px-3.5 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
