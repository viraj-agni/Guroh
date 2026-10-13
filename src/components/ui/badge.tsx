import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase transition-all [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-guroh-primary/20 text-guroh-ivory border-guroh-primary/40",
        secondary:
          "bg-guroh-gold-dark/20 text-guroh-gold-dark border-guroh-gold-dark/40",
        mastery:
          "bg-guroh-emerald/20 text-emerald-400 border-guroh-emerald/50 shadow-[0_0_8px_rgba(45,106,79,0.3)]",
        sapphire:
          "bg-guroh-sapphire-dark/20 text-blue-300 border-guroh-sapphire-dark/40",
        outline:
          "border-white/10 text-guroh-ivory bg-guroh-surface",
        ghost:
          "bg-white/5 text-guroh-ivory border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
