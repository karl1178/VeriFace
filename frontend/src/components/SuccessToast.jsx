export default function SuccessToast({ message, id }) {
  if (!message) return null;

  return (
    <div key={id} className="scanner-toast fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4" aria-live="polite">
      <div role="status" className="flex w-full max-w-lg items-center gap-3 rounded-lg border border-[var(--color-success-border)] bg-white px-4 py-3 shadow-lg">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white" aria-hidden="true">✓</span>
        <span className="text-sm font-medium text-[var(--color-brand-hover)]">{message}</span>
      </div>
    </div>
  );
}
