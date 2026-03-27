export default function Card({ title, description, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${className}`}>
      {title ? (
        <div className="mb-5 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
