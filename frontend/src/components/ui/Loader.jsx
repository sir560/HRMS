export default function Loader({ size = 18, className = "" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    />
  );
}
