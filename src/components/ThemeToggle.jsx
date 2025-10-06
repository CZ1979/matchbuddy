import { useEffect } from "react";

export default function ThemeToggle() {
  // 🌗 Umschalten zwischen friendly (hell, grün) und dark (dunkel)
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "friendly" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  useEffect(() => {
    // 🧠 Beim Start gespeichertes Theme abrufen
    const saved = localStorage.getItem("theme") || "friendly";
    document.documentElement.setAttribute("data-theme", saved);

    // 🔒 Failsafe: falls DaisyUI anderes gesetzt hat → überschreiben
    if (saved !== "friendly" && saved !== "dark") {
      document.documentElement.setAttribute("data-theme", "friendly");
      localStorage.setItem("theme", "friendly");
    }

    // 🩵 Debug optional:
    // console.log("Aktives Theme:", document.documentElement.getAttribute("data-theme"));
  }, []);

  return (
    <button
      className="btn btn-sm btn-ghost flex items-center gap-2"
      onClick={toggleTheme}
      title="Dark Mode umschalten"
    >
      <span role="img" aria-label="sun-moon">
        🌞 / 🌙
      </span>
    </button>
  );
}
