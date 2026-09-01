import type { ButtonHTMLAttributes } from "react";

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "quiet";
};

export function PixelButton({
  variant = "default",
  className = "",
  type = "button",
  ...props
}: PixelButtonProps) {
  return (
    <button
      type={type}
      className={`pixel-button pixel-button-${variant} ${className}`.trim()}
      {...props}
    />
  );
}

