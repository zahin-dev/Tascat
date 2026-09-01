import { PixelButton } from "./PixelButton";
import { PixelDialog } from "./PixelDialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = "confirm-dialog-title";
  return (
    <PixelDialog open={open} onClose={onClose} titleId={titleId}>
      <div className="dialog-header">
        <span className="dialog-kicker"><span className="dialog-cross pixel-asset" aria-hidden="true" /> CONFIRM</span>
        <h2 id={titleId}>{title}</h2>
      </div>
      <p className="dialog-description">{description}</p>
      <div className="dialog-footer">
        <PixelButton data-autofocus onClick={onClose}>キャンセル</PixelButton>
        <PixelButton
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </PixelButton>
      </div>
    </PixelDialog>
  );
}
