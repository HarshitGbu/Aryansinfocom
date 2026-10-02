import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[12px] text-sm font-medium transition active:scale-95 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none min-h-[44px] px-5",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-neutral-200",
        glass: "liquid-glass text-text hover:bg-white/10",
        ghost: "text-text-muted hover:bg-white/10 hover:text-text",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps): React.JSX.Element {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
