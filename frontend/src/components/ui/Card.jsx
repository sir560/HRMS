export default function Card({ title, description, children, className = "" }) {
  return (
    <section className={`rounded-xl bg-white p-6 shadow-[0_8px_32px_rgba(25,28,30,0.06)] ${className}`}>
      {title ? (
        <div className="mb-5 space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
