import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-maroon text-ivory hover:bg-maroon-deep",
        secondary: "bg-gold-soft text-maroon-deep hover:bg-gold/30",
        ghost: "bg-transparent text-ink hover:bg-surface-muted",
        danger: "bg-transparent text-link border border-maroon/40 hover:bg-blush/40",
      },
      size: { sm: "h-9 px-3", md: "h-11 px-5", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-maroon",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-maroon",
        props.className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink/80">
      {children}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "green" | "maroon" | "blush" }) {
  const tones = {
    neutral: "bg-surface-muted text-ink ring-1 ring-inset ring-line",
    gold: "bg-gold-soft text-maroon-deep",
    green: "bg-sage/20 text-[#46553f] dark:text-[#c4d3ba]",
    blush: "bg-blush/70 text-maroon-deep dark:bg-maroon/40 dark:text-blush",
    maroon: "bg-maroon text-ivory",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-sm", className)}>{children}</div>;
}

export function Field({ label, hint, optional, className, children }: { label: string; hint?: string; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-medium text-ink/80">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted">(optional)</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
