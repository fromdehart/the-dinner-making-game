import React from "react";

type Group = "grains" | "protein" | "dairy" | "fruits" | "vegetables";

interface PlateSectionProps {
  group: Group;
  food: { name: string; emoji: string } | null;
  addons: { name: string; emoji: string }[];
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const GROUP_COLORS: Record<Group, { empty: string; filled: string }> = {
  grains:     { empty: "bg-amber-50 border-amber-200",  filled: "bg-amber-200"  },
  protein:    { empty: "bg-red-50 border-red-200",      filled: "bg-red-200"    },
  dairy:      { empty: "bg-blue-50 border-blue-200",    filled: "bg-blue-200"   },
  fruits:     { empty: "bg-orange-50 border-orange-200", filled: "bg-orange-200" },
  vegetables: { empty: "bg-green-50 border-green-200",  filled: "bg-green-200"  },
};

const GROUP_LABELS: Record<Group, string> = {
  grains: "Grains",
  protein: "Protein",
  dairy: "Dairy",
  fruits: "Fruits",
  vegetables: "Vegetables",
};

export function PlateSection({ group, food, addons, onClick, className = "", style }: PlateSectionProps) {
  const colors = GROUP_COLORS[group];

  return (
    <div className={`w-full h-full transition-all duration-300 ${className}`} style={style}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-full flex items-center justify-center rounded-none ${
          food ? colors.filled : `${colors.empty} border-2 border-dashed`
        }`}
      >
        {food ? (
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-4xl sm:text-5xl">{food.emoji}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {food.name}
            </span>
            {addons.length > 0 && (
              <div className="flex gap-0.5 flex-wrap justify-center">
                {addons.map((a, i) => (
                  <span key={i} className="text-xl">{a.emoji}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <span className="text-2xl">+</span>
            <span className="text-xs font-medium">{GROUP_LABELS[group]}</span>
          </div>
        )}
      </button>
    </div>
  );
}
