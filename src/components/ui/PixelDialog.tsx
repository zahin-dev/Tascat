import { useEffect, useRef, type ReactNode } from "react";

type PixelDialogProps = {
  open: boolean;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  size?: "small" | "large";
};

export function PixelDialog({ open, titleId, onClose, children, size = "small" }: PixelDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      window.requestAnimationFrame(() => {
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(
    () => () => {
      returnFocusRef.current?.focus();
    },
    [],
  );

  return (
    <dialog
      ref={dialogRef}
      className={`pixel-dialog pixel-dialog-${size}`}
      aria-labelledby={titleId}
      onCancel={() => onClose()}
      onClose={() => {
        if (open) onClose();
        returnFocusRef.current?.focus();
      }}
    >
      {children}
    </dialog>
  );
}

