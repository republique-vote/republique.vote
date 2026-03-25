import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 border-l-[3px]",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-l-border",
        destructive:
          "bg-[#fee9e9] dark:bg-[#301717] text-[#ce0500] dark:text-[#ff5655] border-l-[#ce0500] dark:border-l-[#ff5655] *:data-[slot=alert-description]:text-[#ce0500]/80 dark:*:data-[slot=alert-description]:text-[#ff5655]/80",
        success:
          "bg-[#dffee6] dark:bg-[#142117] text-[#18753c] dark:text-[#27a658] border-l-[#18753c] dark:border-l-[#27a658] *:data-[slot=alert-description]:text-[#18753c]/80 dark:*:data-[slot=alert-description]:text-[#27a658]/80",
        info:
          "bg-[#e8edff] dark:bg-[#171d2e] text-[#0063cb] dark:text-[#518fff] border-l-[#0063cb] dark:border-l-[#518fff] *:data-[slot=alert-description]:text-[#0063cb]/80 dark:*:data-[slot=alert-description]:text-[#518fff]/80",
        warning:
          "bg-[#ffe9e6] dark:bg-[#2d1814] text-[#b34000] dark:text-[#fc5d00] border-l-[#b34000] dark:border-l-[#fc5d00] *:data-[slot=alert-description]:text-[#b34000]/80 dark:*:data-[slot=alert-description]:text-[#fc5d00]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-heading font-bold group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
