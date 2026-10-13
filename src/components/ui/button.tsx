import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-guroh-primary text-guroh-ivory hover:bg-guroh-primary-vivid shadow-[0_4px_12px_rgba(141,21,22,0.3)]",
        secondary:
          "bg-guroh-gold-dark text-guroh-gold-ink hover:bg-guroh-gold-light dark:bg-guroh-gold-dark dark:text-guroh-gold-ink dark:hover:bg-guroh-gold-light shadow-[0_4px_12px_rgba(217,160,102,0.2)]",
        emerald:
          "bg-guroh-emerald text-guroh-ivory hover:bg-emerald-600 shadow-[0_4px_12px_rgba(45,106,79,0.3)]",
        sapphire:
          "bg-guroh-sapphire-dark text-guroh-ivory hover:bg-blue-700 shadow-[0_4px_12px_rgba(42,82,190,0.3)]",
        outline:
          "border-white/10 dark:border-white/10 light:border-black/10 bg-guroh-surface text-guroh-ivory hover:bg-white/5 hover:text-white",
        ghost:
          "hover:bg-white/5 text-guroh-ivory",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-guroh-gold-dark underline-offset-4 hover:underline",
      },
      size: {
        // Standard Fitts's Law Target: min-h-[48px]
        default:
          "min-h-[48px] h-12 gap-2 px-5 py-2.5 text-base",
        // Horizon 1 / Early Learner Fitts's Law Target (5-7yo): min-h-[52px]
        earlyLearner:
          "min-h-[52px] h-13 gap-2.5 px-6 py-3 text-lg font-bold tracking-wide rounded-xl",
        sm:
          "min-h-[40px] h-10 gap-1.5 px-3.5 text-sm",
        lg:
          "min-h-[56px] h-14 gap-3 px-8 text-xl font-bold",
        icon: "size-12 min-h-[48px] min-w-[48px]",
        "icon-early": "size-13 min-h-[52px] min-w-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
