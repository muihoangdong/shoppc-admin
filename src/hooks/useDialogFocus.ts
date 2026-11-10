import { useEffect, useRef } from 'react';

/** Trap only the top dialog: nested confirmations keep their own keyboard handling. */
export default function useDialogFocus(active: boolean) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !root.current) return;
      const dialogs = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')];
      if (dialogs[dialogs.length - 1] !== root.current) return;
      const controls = [
        ...root.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [active]);
  return root;
}
