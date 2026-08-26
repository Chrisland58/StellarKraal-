"use client";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * ConfirmDialog — #810
 *
 * Accepts a `variant` prop:
 *   "default"     → confirm button uses the secondary (gold) style
 *   "destructive" → confirm button uses the danger (red) token colour
 *
 * The cancel button always uses a neutral ghost style.
 *
 * Accessibility:
 *  - The destructive confirm button carries an `aria-label` that describes
 *    the consequence of the action (e.g. "Delete loan permanently").
 *  - The dialog has role="dialog" with an accessible title via the Modal.
 */

export type ConfirmDialogVariant = "default" | "destructive";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * `default`     — standard confirmation (secondary button style).
   * `destructive` — irreversible / dangerous action (danger token colour).
   * @default "default"
   */
  variant?: ConfirmDialogVariant;
  /**
   * Accessible label that describes the consequence of confirming a
   * destructive action. Falls back to `confirmLabel` when omitted.
   *
   * Example: "Delete this loan permanently"
   */
  destructiveAriaLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  destructiveAriaLabel,
  onConfirm,
  onCancel,
}: Props) {
  const isDestructive = variant === "destructive";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "secondary"}
            onClick={onConfirm}
            aria-label={
              isDestructive
                ? (destructiveAriaLabel ?? confirmLabel)
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[color:var(--token-text-subtle)]">{message}</p>
    </Modal>
  );
}
