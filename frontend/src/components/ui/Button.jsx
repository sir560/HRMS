export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-gradient-to-r from-[#00439f] to-[#1f5bc3] text-white shadow-lg shadow-[#00439f]/20 hover:scale-[1.02] focus:ring-blue-100",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-100",
    ghost: "bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>
      {children}
    </button>
  );
}
