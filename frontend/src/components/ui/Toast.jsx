export default function Toast({ type = "success", message, onClose }) {
  if (!message) {
    return null;
  }

  const palette =
    type === "error"
      ? "border-rose-200 bg-white text-rose-700"
      : "border-emerald-200 bg-white text-emerald-700";

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-200/70 ${palette}`}>
      <div className="flex-1 text-sm font-medium leading-6">{message}</div>
      <button className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 hover:text-slate-700" onClick={onClose} type="button">
        Dismiss
      </button>
    </div>
  );
}
