export default function SuccessToast({ message, id, type = "success" }) {
  if (!message) return null;

  return (
    <div key={id} className="scanner-toast fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4" aria-live="polite">
      <div role={type === "error" ? "alert" : "status"} className={`flex w-full max-w-lg items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg ${type === "error" ? "border-[var(--color-danger-border)]" : "border-[var(--color-success-border)]"}`}>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${type === "error" ? "bg-[var(--color-danger)]" : "bg-[var(--color-brand)]"}`} aria-hidden="true">
          {type === "error" ? "!" : "✓"}
        </span>
        <span className={`text-sm font-medium ${type === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-brand-hover)]"}`}>{message}</span>
      </div>
    </div>
  );
}
