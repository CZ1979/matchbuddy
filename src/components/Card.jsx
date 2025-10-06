export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm border border-friendly-100 rounded-2xl shadow-card hover:shadow-card-hover p-6 transition-all ${className}`}
    >
      {children}
    </div>
  );
}
