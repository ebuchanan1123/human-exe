import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "plain";
}

export function PixelButton({
  children,
  variant = "plain",
  className = "",
  ...props
}: PixelButtonProps) {
  const tone =
    variant === "primary" ? "bg-mint text-bg" : "bg-cream text-bg";
  return (
    <button
      type="button"
      {...props}
      className={`bevel-out pixel-btn font-pixel inline-flex cursor-pointer items-center justify-center gap-3 px-5 py-3 text-xs sm:text-sm ${tone} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream ${className}`}
    >
      {children}
    </button>
  );
}
