import {
  memo,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import styles from "../../../css/chessGame.module.css";
import { Icon } from "./icons";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  size?: "default" | "large";
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const Modal = memo(function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  icon,
  size = "default",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId(),
    descId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(focusableSelector);
    target?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && onClose) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        className={`${styles.modal} ${size === "large" ? styles.modalLarge : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        {onClose && (
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.modalClose}`}
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        )}
        {icon && <div className={styles.modalIcon}>{icon}</div>}
        <h2 id={titleId} className={styles.modalTitle}>
          {title}
        </h2>
        {description && (
          <p id={descId} className={styles.modalLede}>
            {description}
          </p>
        )}
        <div
          className={styles.modalBody}
          data-scroll={size === "large" ? "" : undefined}
        >
          {children}
        </div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
});
