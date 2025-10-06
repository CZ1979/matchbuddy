export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  const base =
    "px-4 py-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-friendly-600 hover:bg-friendly-700 text-white shadow-sm hover:shadow-md focus:ring-friendly-400",
    secondary:
      "bg-white border border-friendly-300 text-friendly-700 hover:bg-friendly-50 focus:ring-friendly-300",
    ghost:
      "text-friendly-700 hover:text-friendly-800 hover:bg-friendly-50 focus:ring-friendly-200",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
