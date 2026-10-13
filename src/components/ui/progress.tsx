"use client"

import * as React from "react"
import { cn } from "cn"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "mastery" | "gold" | "sapphire"
}

export function Progress({
  className,
  value = 0,
  max = 100,
  variant = "mastery",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, ((value || 0) / max) * 100))

  const variantBarClasses = {
    mastery: "bg-guroh-emerald shadow-[0_0_10px_rgba(45,106,79,0.5)]", // Sage Emerald #2D6A4F
    default: "bg-guroh-primary shadow-[0_0_10px_rgba(141,21,22,0.5)]",  // Deep Oxblood #8D1516
    gold: "bg-guroh-gold-dark shadow-[0_0_10px_rgba(217,160,102,0.5)]", // Academic Gold #D9A066
    sapphire: "bg-guroh-sapphire-dark shadow-[0_0_10px_rgba(42,82,190,0.5)]", // Oxford Blue #2A52BE
  }

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-guroh-surface border border-white/10 dark:border-white/10 light:border-black/10",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full",
          variantBarClasses[variant]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
