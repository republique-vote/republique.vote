import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 border border-l-[3px] px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 has-data-[slot=alert-action]:pr-18 *:[svg:not([class*='size-'])]:size-4 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-l-border bg-card text-card-foreground",
        destructive:
          "border-l-[#ce0500] bg-[#fee9e9] text-[#ce0500] *:data-[slot=alert-description]:text-[#ce0500]/80 dark:border-l-[#ff5655] dark:bg-[#301717] dark:text-[#ff5655] dark:*:data-[slot=alert-description]:text-[#ff5655]/80",
        success:
          "border-l-[#18753c] bg-[#dffee6] text-[#18753c] *:data-[slot=alert-description]:text-[#18753c]/80 dark:border-l-[#27a658] dark:bg-[#142117] dark:text-[#27a658] dark:*:data-[slot=alert-description]:text-[#27a658]/80",
        info: "border-l-[#0063cb] bg-[#e8edff] text-[#0063cb] *:data-[slot=alert-description]:text-[#0063cb]/80 dark:border-l-[#518fff] dark:bg-[#171d2e] dark:text-[#518fff] dark:*:data-[slot=alert-description]:text-[#518fff]/80",
        warning:
          "border-l-[#b34000] bg-[#ffe9e6] text-[#b34000] *:data-[slot=alert-description]:text-[#b34000]/80 dark:border-l-[#fc5d00] dark:bg-[#2d1814] dark:text-[#fc5d00] dark:*:data-[slot=alert-description]:text-[#fc5d00]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-bold font-heading group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      data-slot="alert-title"
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-balance text-sm md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("absolute top-2 right-2", className)}
      data-slot="alert-action"
      {...props}
    />
  );
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
