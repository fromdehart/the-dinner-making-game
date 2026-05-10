import { useState } from "react";

interface StarPickerProps {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const filled = Math.max(hovered ?? 0, (value ?? 0) / 10);

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="flex gap-0.5 justify-center">
        {Array.from({ length: 10 }, (_, i) => {
          const star = i + 1;
          return (
            <button
              key={star}
              type="button"
              className="text-2xl sm:text-3xl focus:outline-none"
              style={{ color: star <= filled ? "#f59e0b" : "#d1d5db" }}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onChange(star * 10)}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mt-1 text-center">
        {value !== null ? `${value} / 100 points` : "Tap a star to rate"}
      </p>
    </div>
  );
}
