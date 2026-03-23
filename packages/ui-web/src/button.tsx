import type { ButtonHTMLAttributes } from "react";
import { cn } from "@thuocare/utils";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800",
        className,
      )}
      {...props}
    />
  );
}
