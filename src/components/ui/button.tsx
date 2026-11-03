import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm leading-150 transition-colors disabled:pointer-events-none disabled:opacity-40",
  { variants: {
    variant: {
      default: "border-transparent bg-black-100 text-white hover:bg-black-030",
      outline: "border-transparent bg-black-005 text-black-100 hover:bg-black-010",
      ghost: "border-transparent bg-transparent text-black-100 hover:bg-black-005",
      link: "border-transparent text-black-100 underline underline-offset-4",
    },
    size: { default: "px-4 py-3", sm: "px-3 py-2", icon: "px-3 py-3" },
  }, defaultVariants: { variant: "default", size: "default" } },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";
  return <Component type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { Button, buttonVariants };
