import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-white shadow-[0_8px_24px_rgba(21,23,20,.16)] hover:-translate-y-0.5 hover:bg-black",
        accent:
          "bg-accent text-white shadow-[0_8px_24px_rgba(182,138,58,.2)] hover:-translate-y-0.5 hover:bg-accent-strong",
        outline: "border bg-white/70 hover:border-foreground/30 hover:bg-white",
        ghost: "hover:bg-foreground/6",
        danger: "bg-danger text-white hover:brightness-95",
      },
      size: {
        sm: "min-h-9 rounded-lg px-3 text-xs",
        md: "min-h-11 px-5",
        lg: "min-h-13 rounded-2xl px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
